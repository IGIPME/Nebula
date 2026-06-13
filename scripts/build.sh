#!/usr/bin/env bash
# ── Nebula 构建与推送脚本 ────────────────────────────────────────
#
# 在项目根目录下构建前后端 Docker 镜像并推送到腾讯云 TCR。
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
BACKEND_REPO="${REGISTRY}/${NAMESPACE}/nebula.backend"
FRONTEND_REPO="${REGISTRY}/${NAMESPACE}/nebula.frontend"
MPMCP_REPO="${REGISTRY}/${NAMESPACE}/nebula.mpmcp"

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
echo " 后端: ${BACKEND_REPO}"
echo " 前端: ${FRONTEND_REPO}"
echo " mpmcp: ${MPMCP_REPO}"
echo " 标签: ${TAGS[*]}"
echo "========================================"

# ── 构建后端 ──────────────────────────────────────────────────────
echo ""
echo "[1/5] 构建后端镜像..."
docker build \
    -f "${PROJECT_ROOT}/Dockerfile.backend" \
    -t "${BACKEND_REPO}:${DATE_TAG}" \
    "${PROJECT_ROOT}"

# ── 构建前端 ──────────────────────────────────────────────────────
echo ""
echo "[2/5] 构建前端镜像..."
docker build \
    -f "${PROJECT_ROOT}/Dockerfile.frontend" \
    -t "${FRONTEND_REPO}:${DATE_TAG}" \
    "${PROJECT_ROOT}"

# ── 构建 mpmcp ─────────────────────────────────────────────────────
echo ""
echo "[3/5] 构建 mpmcp 镜像..."
docker build \
    -f "${PROJECT_ROOT}/src/python/mpmcp/Dockerfile" \
    -t "${MPMCP_REPO}:${DATE_TAG}" \
    "${PROJECT_ROOT}"

# ── 打标签 ────────────────────────────────────────────────────────
echo ""
echo "[4/5] 打标签..."
for tag in "${TAGS[@]}"; do
    if [[ "${tag}" != "${DATE_TAG}" ]]; then
        echo "  tagging ${BACKEND_REPO}:${tag}"
        docker tag "${BACKEND_REPO}:${DATE_TAG}" "${BACKEND_REPO}:${tag}"
        echo "  tagging ${FRONTEND_REPO}:${tag}"
        docker tag "${FRONTEND_REPO}:${DATE_TAG}" "${FRONTEND_REPO}:${tag}"
        echo "  tagging ${MPMCP_REPO}:${tag}"
        docker tag "${MPMCP_REPO}:${DATE_TAG}" "${MPMCP_REPO}:${tag}"
    fi
done

# ── 推送 ──────────────────────────────────────────────────────────
echo ""
echo "[5/5] 推送镜像..."
for tag in "${TAGS[@]}"; do
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
echo " 后端: ${BACKEND_REPO}:${DATE_TAG}"
echo " 前端: ${FRONTEND_REPO}:${DATE_TAG}"
echo " mpmcp: ${MPMCP_REPO}:${DATE_TAG}"
echo "========================================"
