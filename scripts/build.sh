#!/usr/bin/env bash
# ── Nebula 构建与推送脚本 ────────────────────────────────────────
#
# 在项目根目录下构建所有 Docker 镜像并推送到腾讯云 TCR。
#
# 使用方式：
#   chmod +x scripts/build.sh
#   ./scripts/build.sh              # 推送 latest + 日期标签
#   TAG=20260611 ./scripts/build.sh # 只推送指定标签（latest 除外）
#
# 前置条件：
#   - docker 已安装
#   - 已登录腾讯云 TCR：docker login ccr.ccs.tencentyun.com
#   - 在项目根目录执行

set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────────────
REGISTRY="${REGISTRY:-ccr.ccs.tencentyun.com}"
NAMESPACE="${NAMESPACE:-igipme.nebula}"
APISIX_REPO="${REGISTRY}/${NAMESPACE}/nebula.apisix"
BACKEND_REPO="${REGISTRY}/${NAMESPACE}/nebula.server"
FRONTEND_REPO="${REGISTRY}/${NAMESPACE}/nebula.frontend"
MPMCP_REPO="${REGISTRY}/${NAMESPACE}/nebula.mpmcp"
HERMES_REPO="${REGISTRY}/${NAMESPACE}/nebula.hermes"

# 上游镜像
APISIX_UPSTREAM="${APISIX_UPSTREAM:-apache/apisix:3.14.0-debian}"
HERMES_UPSTREAM="${HERMES_UPSTREAM:-nousresearch/hermes-agent:latest}"

# 切到脚本所在目录的上级（项目根目录）
cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

# ── 标签 ──────────────────────────────────────────────────────────
DATE_TAG="${TAG:-$(date +%Y%m%d)}"
TAGS=("${DATE_TAG}")
# 如果不指定 TAG，同时推送 latest
if [[ -z "${TAG:-}" ]]; then
    TAGS+=("latest")
fi

echo "========================================"
echo " Nebula Docker 构建与推送"
echo " APISIX: ${APISIX_REPO}"
echo " 后端:   ${BACKEND_REPO}"
echo " 前端:   ${FRONTEND_REPO}"
echo " mpmcp:  ${MPMCP_REPO}"
echo " Hermes: ${HERMES_REPO}"
echo " 标签:   ${TAGS[*]}"
echo "========================================"

# ── 处理上游 APISIX 镜像 ─────────────────────────────────────────
echo ""
echo "[1/7] 拉取上游 APISIX 镜像..."
docker pull "${APISIX_UPSTREAM}"

echo ""
echo "[2/7] 标记 APISIX 镜像..."
for tag in "${TAGS[@]}"; do
    echo "  tagging ${APISIX_UPSTREAM} → ${APISIX_REPO}:${tag}"
    docker tag "${APISIX_UPSTREAM}" "${APISIX_REPO}:${tag}"
done

# ── 处理上游 Hermes 镜像 ─────────────────────────────────────────
echo ""
echo "[3/7] 拉取上游 Hermes 镜像..."
docker pull "${HERMES_UPSTREAM}"

echo ""
echo "[4/7] 标记 Hermes 镜像..."
for tag in "${TAGS[@]}"; do
    echo "  tagging ${HERMES_UPSTREAM} → ${HERMES_REPO}:${tag}"
    docker tag "${HERMES_UPSTREAM}" "${HERMES_REPO}:${tag}"
done

# ── 构建后端 ──────────────────────────────────────────────────────
echo ""
echo "[5/7] 构建后端镜像..."
docker build \
    -f "${PROJECT_ROOT}/docker/Dockerfile.crates" \
    -t "${BACKEND_REPO}:${DATE_TAG}" \
    "${PROJECT_ROOT}"

# 打后端其他标签
for tag in "${TAGS[@]}"; do
    if [[ "${tag}" != "${DATE_TAG}" ]]; then
        echo "  tagging ${BACKEND_REPO}:${tag}"
        docker tag "${BACKEND_REPO}:${DATE_TAG}" "${BACKEND_REPO}:${tag}"
    fi
done

# ── 构建前端 ──────────────────────────────────────────────────────
echo ""
echo "[6/7] 构建前端镜像..."
docker build \
    -f "${PROJECT_ROOT}/docker/Dockerfile.nebula" \
    -t "${FRONTEND_REPO}:${DATE_TAG}" \
    "${PROJECT_ROOT}"

# 打前端其他标签
for tag in "${TAGS[@]}"; do
    if [[ "${tag}" != "${DATE_TAG}" ]]; then
        echo "  tagging ${FRONTEND_REPO}:${tag}"
        docker tag "${FRONTEND_REPO}:${DATE_TAG}" "${FRONTEND_REPO}:${tag}"
    fi
done

# ── 构建 mpmcp ─────────────────────────────────────────────────────
echo ""
echo "[7/7] 构建 mpmcp 镜像..."
docker build \
    -f "${PROJECT_ROOT}/docker/mpmcp/Dockerfile" \
    -t "${MPMCP_REPO}:${DATE_TAG}" \
    "${PROJECT_ROOT}"

# 打 mpmcp 其他标签
for tag in "${TAGS[@]}"; do
    if [[ "${tag}" != "${DATE_TAG}" ]]; then
        echo "  tagging ${MPMCP_REPO}:${tag}"
        docker tag "${MPMCP_REPO}:${DATE_TAG}" "${MPMCP_REPO}:${tag}"
    fi
done

# ── 推送 ──────────────────────────────────────────────────────────
echo ""
echo ">>> 推送所有镜像..."
for tag in "${TAGS[@]}"; do
    echo "  pushing ${APISIX_REPO}:${tag}"
    docker push "${APISIX_REPO}:${tag}"
    echo "  pushing ${HERMES_REPO}:${tag}"
    docker push "${HERMES_REPO}:${tag}"
    echo "  pushing ${BACKEND_REPO}:${tag}"
    docker push "${BACKEND_REPO}:${tag}"
    echo "  pushing ${FRONTEND_REPO}:${tag}"
    docker push "${FRONTEND_REPO}:${tag}"
    echo "  pushing ${MPMCP_REPO}:${tag}"
    docker push "${MPMCP_REPO}:${tag}"
done

echo ""
echo "========================================"
echo " 完成！"
echo " APISIX: ${APISIX_REPO}:${DATE_TAG}"
echo " Hermes: ${HERMES_REPO}:${DATE_TAG}"
echo " 后端:   ${BACKEND_REPO}:${DATE_TAG}"
echo " 前端:   ${FRONTEND_REPO}:${DATE_TAG}"
echo " mpmcp:  ${MPMCP_REPO}:${DATE_TAG}"
echo "========================================"
