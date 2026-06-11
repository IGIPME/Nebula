use std::net::SocketAddr;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "nebula_ffi=info,tower_http=info".into()),
        )
        .init();

    let address = std::env::var("NEBULA_SERVER_ADDR")
        .unwrap_or_else(|_| "127.0.0.1:3030".to_string())
        .parse::<SocketAddr>()?;
    let listener = tokio::net::TcpListener::bind(address).await?;

    tracing::info!("Nebula server listening on http://{}", address);

    axum::serve(listener, nebula_ffi::app())
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    if let Err(error) = tokio::signal::ctrl_c().await {
        tracing::warn!(%error, "failed to install Ctrl+C handler");
    }
}
