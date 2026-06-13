# 1. 使用 Ubuntu 22.04 作为基础镜像
FROM ubuntu:22.04

# 2. 安装 Miniconda 所需的依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends wget ca-certificates && \
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
COPY environment.yml ~/environment.yml

# 9. 准备 mpmeep 环境
RUN conda env create -f ~/environment.yml

# 默认命令
CMD ["/bin/bash"]