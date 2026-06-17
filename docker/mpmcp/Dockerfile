# 1. 使用 Ubuntu 22.04 作为基础镜像
FROM ubuntu:22.04

# 2. 安装 Miniconda 所需的依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends wget ca-certificates openssh-server && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 3. 创建一个名为 'nebula' 的非 root 用户和同名的组
#    -m: 创建用户家目录 (/home/nebula)
#    -s: 指定默认的 shell
ARG USERNAME=nebula
ARG USER_UID=1000
ARG USER_GID=1000

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m -s /bin/bash $USERNAME

# 3.5 配置 SSH 服务
RUN mkdir -p /var/run/sshd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    echo 'AllowUsers nebula' >> /etc/ssh/sshd_config

# 创建 .ssh 目录（SSH 密钥认证通过卷挂载注入 authorized_keys）
RUN mkdir -p /home/$USERNAME/.ssh && chmod 700 /home/$USERNAME/.ssh && chown $USERNAME:$USERNAME /home/$USERNAME/.ssh

# 设置 nebula 用户的 SSH 登录密码（开发环境回退；生产通过 entrypoint.sh 禁用）
ARG NEBULA_PASSWORD=nebula
RUN echo "nebula:${NEBULA_PASSWORD}" | chpasswd

# 4. 切换到新用户 'nebula' 执行后续命令
USER $USERNAME
WORKDIR /home/$USERNAME

# 5. 下载并在 nebula 的用户目录下安装 Miniconda
ENV CONDA_DIR=/home/$USERNAME/miniconda3
RUN wget --quiet https://mirror.tuna.tsinghua.edu.cn/anaconda/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \
    # 使用 -b 跳过安装配置询问，-p 指定安装目录
    /bin/bash ~/miniconda.sh -b -p $CONDA_DIR && \
    rm ~/miniconda.sh

# 6. 将 conda 加入 PATH，方便直接使用
ENV PATH=$CONDA_DIR/bin:$PATH

# 7. 初始化 conda，使 shell 命令可用
RUN conda init bash

# 8. 清理安装包，减小镜像体积
RUN conda clean --all -y

# 9. 复制配置文件
COPY src/python/mpmcp/environment.yml /home/nebula/environment.yml

# 10. 接受 conda 默认 channels 的服务条款
RUN conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main \
    && conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r

# 11. 准备 mpmeep 环境
RUN conda env create -f /home/nebula/environment.yml

# 12. 复制示例文件到 Examples 目录
#     同时保留一份副本到 /opt/nebula-examples，供 entrypoint.sh 在卷挂载为空时初始化使用
USER root
COPY src/python/mpmcp/example /home/nebula/Examples
COPY src/python/mpmcp/example /opt/nebula-examples
RUN chown -R nebula:nebula /home/nebula/Examples

# 13. 复制 SSH 入口脚本并设置权限
COPY docker/mpmcp/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# 14. 暴露 SSH 端口
EXPOSE 22

# 15. 设置入口脚本和默认命令
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["sleep", "infinity"]