use std::{collections::HashMap, path::PathBuf};

use axum::{
    Json, Router,
    extract::Path,
    http::{HeaderValue, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use nebula_core::template::{
    self, InitOptions, InitReport, OverwriteMode, TemplateMeta, TemplateSummary, VariableDef,
};
use serde::{Deserialize, Serialize};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

pub fn app() -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/api/templates", get(list_templates))
        .route("/api/templates/{template_name}", get(get_template))
        .route("/api/projects", post(create_project))
        .layer(TraceLayer::new_for_http())
        .layer(cors_layer())
}

fn cors_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(tower_http::cors::Any)
        .allow_origin([
            HeaderValue::from_static("http://localhost:5173"),
            HeaderValue::from_static("http://127.0.0.1:5173"),
        ])
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
    })
}

async fn list_templates() -> Result<Json<TemplatesResponse>, ApiError> {
    let templates = template::list_templates().map_err(ApiError::from_core)?;

    Ok(Json(TemplatesResponse {
        templates: templates
            .into_iter()
            .map(TemplateSummaryDto::from)
            .collect(),
    }))
}

async fn get_template(
    Path(template_name): Path<String>,
) -> Result<Json<TemplateMetaResponse>, ApiError> {
    let meta = template::load_template_meta(&template_name).map_err(ApiError::from_core)?;

    Ok(Json(TemplateMetaResponse::from(meta)))
}

async fn create_project(
    Json(request): Json<CreateProjectRequest>,
) -> Result<(StatusCode, Json<CreateProjectResponse>), ApiError> {
    request.validate()?;

    let overwrite = request.overwrite.to_overwrite_mode();
    let variables = template::normalize_variables(request.variables, "api")?;
    let report = template::initialize_project(InitOptions {
        template_name: request.template_name,
        output_base: PathBuf::from(request.output_base),
        variables,
        overwrite,
        dry_run: request.dry_run,
    })
    .map_err(ApiError::from_core)?;

    let status = if request.dry_run {
        StatusCode::OK
    } else {
        StatusCode::CREATED
    };

    Ok((
        status,
        Json(CreateProjectResponse::from_report(report, request.dry_run)),
    ))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct HealthResponse {
    status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TemplatesResponse {
    templates: Vec<TemplateSummaryDto>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TemplateSummaryDto {
    name: String,
    description: Option<String>,
    version: Option<String>,
}

impl From<TemplateSummary> for TemplateSummaryDto {
    fn from(summary: TemplateSummary) -> Self {
        Self {
            name: summary.name,
            description: summary.description,
            version: summary.version,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TemplateMetaResponse {
    template: TemplateInfoDto,
    variables: HashMap<String, TemplateVariableDto>,
}

impl From<TemplateMeta> for TemplateMetaResponse {
    fn from(meta: TemplateMeta) -> Self {
        let variables = meta
            .variables
            .unwrap_or_default()
            .into_iter()
            .map(|(name, definition)| (name, TemplateVariableDto::from(definition)))
            .collect();

        Self {
            template: TemplateInfoDto {
                name: meta.template.name,
                description: meta.template.description,
                version: meta.template.version,
            },
            variables,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TemplateInfoDto {
    name: String,
    description: String,
    version: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TemplateVariableDto {
    prompt: Option<String>,
    default: Option<String>,
    required: bool,
}

impl From<VariableDef> for TemplateVariableDto {
    fn from(definition: VariableDef) -> Self {
        let required = definition
            .default
            .as_deref()
            .is_none_or(|default| default.is_empty());

        Self {
            prompt: definition.prompt,
            default: definition.default,
            required,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateProjectRequest {
    template_name: String,
    output_base: String,
    variables: HashMap<String, String>,
    overwrite: OverwriteModeDto,
    dry_run: bool,
}

impl CreateProjectRequest {
    fn validate(&self) -> Result<(), ApiError> {
        if self.template_name.trim().is_empty() {
            return Err(ApiError::bad_request("模板名称不能为空"));
        }

        if self.output_base.trim().is_empty() {
            return Err(ApiError::bad_request("输出目录不能为空"));
        }

        Ok(())
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "kebab-case")]
enum OverwriteModeDto {
    Fail,
    Overwrite,
    Skip,
}

impl OverwriteModeDto {
    fn to_overwrite_mode(&self) -> OverwriteMode {
        match self {
            Self::Fail => OverwriteMode::Fail,
            Self::Overwrite => OverwriteMode::Overwrite,
            Self::Skip => OverwriteMode::Skip,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CreateProjectResponse {
    created_dirs: Vec<String>,
    created_files: Vec<String>,
    skipped_files: Vec<String>,
    dry_run: bool,
}

impl CreateProjectResponse {
    fn from_report(report: InitReport, dry_run: bool) -> Self {
        Self {
            created_dirs: paths_to_strings(report.created_dirs),
            created_files: paths_to_strings(report.created_files),
            skipped_files: paths_to_strings(report.skipped_files),
            dry_run,
        }
    }
}

fn paths_to_strings(paths: Vec<PathBuf>) -> Vec<String> {
    paths
        .into_iter()
        .map(|path| path.display().to_string())
        .collect()
}

#[derive(Debug)]
struct ApiError {
    status: StatusCode,
    code: &'static str,
    message: String,
}

impl ApiError {
    fn bad_request(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            code: "invalid_request",
            message: message.into(),
        }
    }

    fn from_core(error: anyhow::Error) -> Self {
        let message = error.to_string();

        if message.contains("不存在") || message.contains("缺少 template.toml") {
            return Self {
                status: StatusCode::NOT_FOUND,
                code: "template_not_found",
                message,
            };
        }

        if message.contains("目标文件已存在") {
            return Self {
                status: StatusCode::CONFLICT,
                code: "project_conflict",
                message,
            };
        }

        if message.contains("缺少模板变量")
            || message.contains("不能为空")
            || message.contains("不能包含")
            || message.contains("不能是绝对路径")
            || message.contains("无法解析")
            || message.contains("值冲突")
        {
            return Self::bad_request(message);
        }

        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            code: "internal_error",
            message,
        }
    }
}

impl From<anyhow::Error> for ApiError {
    fn from(error: anyhow::Error) -> Self {
        Self::from_core(error)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body = Json(ApiErrorResponse {
            error: ApiErrorBody {
                code: self.code,
                message: self.message,
            },
        });

        (self.status, body).into_response()
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ApiErrorResponse {
    error: ApiErrorBody,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ApiErrorBody {
    code: &'static str,
    message: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::{Body, to_bytes},
        http::{Request, StatusCode},
    };
    use serde_json::{Value, json};
    use tower::ServiceExt;

    #[tokio::test]
    async fn health_returns_ok() {
        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn lists_templates() {
        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/api/templates")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response_json(response).await;
        let templates = body["templates"].as_array().expect("templates array");
        assert!(
            templates
                .iter()
                .any(|template| template["name"] == "pic-design")
        );
    }

    #[tokio::test]
    async fn returns_template_meta() {
        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/api/templates/pic-design")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response_json(response).await;
        assert_eq!(body["template"]["name"], "pic-design");
        assert!(body["variables"]["project-name"].is_object());
    }

    #[tokio::test]
    async fn dry_run_project_creation() {
        let response = app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/projects")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        json!({
                            "templateName": "pic-design",
                            "outputBase": std::env::temp_dir().display().to_string(),
                            "variables": {
                                "project-name": "NebulaDryRun",
                                "author": "Alice"
                            },
                            "overwrite": "fail",
                            "dryRun": true
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response_json(response).await;
        assert_eq!(body["dryRun"], true);
        assert!(
            body["createdFiles"]
                .as_array()
                .expect("created files")
                .len()
                > 0
        );
    }

    #[tokio::test]
    async fn unknown_template_returns_not_found() {
        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/api/templates/unknown-template")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    async fn response_json(response: Response) -> Value {
        let bytes = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        serde_json::from_slice(&bytes).unwrap()
    }
}
