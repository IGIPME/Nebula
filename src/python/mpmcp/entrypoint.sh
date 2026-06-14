#!/bin/bash
set -e

# 如果 Examples 目录为空（卷挂载覆盖了构建时内容），从备份初始化
if [ -d "/home/nebula/Examples" ] && [ -z "$(ls -A /home/nebula/Examples 2>/dev/null)" ]; then
    echo ">>> Examples 目录为空，从镜像备份初始化..."
    cp -r /opt/nebula-examples/* /home/nebula/Examples/
    chown -R nebula:nebula /home/nebula/Examples
fi

# 生成 SSH 主机密钥（如果不存在）
if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
    ssh-keygen -A
fi

# 启动 SSH 守护进程
/usr/sbin/sshd

# 执行 CMD（如 sleep infinity 等）
exec "$@"
