#!/bin/bash
set -e

# ── SSH 密钥认证设置 ────────────────────────────────────────────────
# 如果提供了 authorized_keys 文件，配置密钥认证并禁用密码登录
AUTHORIZED_KEYS_SOURCE="/home/nebula/.ssh/authorized_keys"
if [ -f "$AUTHORIZED_KEYS_SOURCE" ] && [ -s "$AUTHORIZED_KEYS_SOURCE" ]; then
    echo ">>> 检测到 authorized_keys，启用 SSH 密钥认证..."
    mkdir -p /home/nebula/.ssh
    chmod 700 /home/nebula/.ssh
    chown nebula:nebula /home/nebula/.ssh

    # 禁用密码登录，仅允许密钥认证
    sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    echo ">>> SSH 密码登录已禁用，仅允许密钥认证"
else
    echo ">>> 未检测到 authorized_keys，使用密码登录（不安全，仅用于开发）"
fi

# ── Examples 目录初始化 ─────────────────────────────────────────────
if [ -d "/home/nebula/Examples" ] && [ -z "$(ls -A /home/nebula/Examples 2>/dev/null)" ]; then
    echo ">>> Examples 目录为空，从镜像备份初始化..."
    cp -r /opt/nebula-examples/* /home/nebula/Examples/
    chown -R nebula:nebula /home/nebula/Examples
fi

# ── SSH 主机密钥 ─────────────────────────────────────────────────────
if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
    ssh-keygen -A
fi

# ── 启动 SSH 守护进程 ────────────────────────────────────────────────
/usr/sbin/sshd

# ── 执行 CMD ─────────────────────────────────────────────────────────
exec "$@"
