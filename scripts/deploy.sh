#!/usr/bin/env bash
# ── Nebula 生产环境部署脚本 ──────────────────────────────────────
#
# 从 CDN 拉取配置文件，然后从腾讯云 TCR 拉取镜像并启动服务。
#
# 使用方式：
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh              # 使用默认配置部署
#   ./scripts/deploy.sh --update     # 更新配置后重新部署
#   ./scripts/deploy.sh --down       # 停止并清理
#
# 前置条件：
#   - docker 已安装
#   - 已登录腾讯云 TCR：docker login ccr.ccs.tencentyun.com

set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────────────
CDN_BASE="${CDN_BASE:-https://cdn.istaroth.xin/nebula}"
FILES=("docker-compose.production.yml" ".env.example")
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

# ── 参数解析 ──────────────────────────────────────────────────────
ACTION="deploy"

for arg in "${@}"; do
    case "${arg}" in
        --update) ACTION="update" ;;
        --down)   ACTION="down" ;;
        --help|-h)
            echo "用法: $0 [--update|--down]"
            echo "  (无参数)   拉取镜像并启动服务"
            echo "  --update   重新从 CDN 下载配置，然后重新部署"
            echo "  --down     停止并移除容器"
            exit 0
            ;;
        *)
            echo "未知参数: ${arg}，使用 --help 查看帮助"
            exit 1
            ;;
    esac
done

# ── 停止 / 清理 ──────────────────────────────────────────────────
if [[ "${ACTION}" == "down" ]]; then
    echo ">>> 停止并移除容器..."
    if [[ -f "${COMPOSE_FILE}" ]]; then
        docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" down --remove-orphans 2>/dev/null || true
    else
        echo "未找到 ${COMPOSE_FILE}，尝试通过容器名停止..."
        docker stop nebula-frontend nebula-server nebula-mpmcp 2>/dev/null || true
        docker rm nebula-frontend nebula-server nebula-mpmcp 2>/dev/null || true
    fi
    echo ">>> 已停止"
    exit 0
fi

# ── 下载配置文件 ──────────────────────────────────────────────────
if [[ "${ACTION}" == "update" ]] || [[ ! -f "${COMPOSE_FILE}" ]] || [[ ! -f "${ENV_EXAMPLE}" ]]; then
    echo ">>> 从 CDN 下载配置文件..."
    for f in "${FILES[@]}"; do
        url="${CDN_BASE}/${f}"
        echo "  下载 ${url} → ${f}"
        if ! curl -fSL --connect-timeout 10 --max-time 30 -o "${f}" "${url}"; then
            echo "  ✗ 下载失败: ${url}"
            exit 1
        fi
    done
    echo ">>> 配置文件下载完成"
else
    echo ">>> 配置文件已存在，跳过下载（使用 --update 强制更新）"
fi

# ── 生成 .env ─────────────────────────────────────────────────────
if [[ ! -f "${ENV_FILE}" ]]; then
    echo ">>> 从 ${ENV_EXAMPLE} 生成 ${ENV_FILE}..."
    cp "${ENV_EXAMPLE}" "${ENV_FILE}"
    cat <<'HINT'

========================================
  提示：请编辑 .env 文件，根据实际环境调整配置（端口、镜像版本等），然后重新运行部署脚本。
  vi .env
========================================

HINT
    exit 0
fi

# ── 拉取镜像 ──────────────────────────────────────────────────────
echo ">>> 拉取最新镜像..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull

# ── 启动服务 ──────────────────────────────────────────────────────
echo ""
echo ">>> 启动服务..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d

# ── 状态 ──────────────────────────────────────────────────────────
echo ""
echo ">>> 服务状态:"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps

echo ""
echo "========================================"
echo " 部署完成！"
echo " 前端: http://localhost (或配置的端口)"
echo " 后端: http://localhost:3030"
echo ""
echo " 常用命令:"
echo "   查看日志: docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} logs -f"
echo "   停止服务: ./scripts/deploy.sh --down"
echo "========================================"
