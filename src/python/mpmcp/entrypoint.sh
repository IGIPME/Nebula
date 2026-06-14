#!/bin/bash
set -e

# 生成 SSH 主机密钥（如果不存在）
if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
    ssh-keygen -A
fi

# 启动 SSH 守护进程
/usr/sbin/sshd

# 执行 CMD（如 sleep infinity 等）
exec "$@"
