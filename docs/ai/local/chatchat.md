---
title: chatchat 本地部署
---

>[chatchat-space/Langchain-Chatchat: Langchain-Chatchat (github.com)](https://github.com/chatchat-space/Langchain-Chatchat)

## 依赖

### xinference

> [xorbitsai/inference: Replace OpenAI GPT with another LLM in your app by changing a single line of code. Xinference gives you the freedom to use any LLM you need. With Xinference, you're empowered to run inference with any open-source language models, speech recognition models, and multimodal models, whether in the cloud, on-premises, or even on your laptop. (github.com)](https://github.com/xorbitsai/inference)
>
> [欢迎来到 Xinference！ — Xinference](https://inference.readthedocs.io/zh-cn/latest/index.html)
>
> 启动后访问 http://127.0.0.1:9997/ui/ ，启动本地模型。

```
# 安装
pip install "xinference[transformers]"

# 启动
xinference-local
```

### oneapi

> [songquanpeng/one-api: OpenAI 接口管理 & 分发系统(github.com)](https://github.com/songquanpeng/one-api)
>
> 安装简单，http://127.0.0.1:3000/。

```
docker run --name one-api -d --restart always -p 3000:3000 -e TZ=Asia/Shanghai -v /home/ubuntu/data/one-api:/data justsong/one-api
```

#### 注意事项

- Azure OpenAi 
  - **模型部署名称必须和模型名称保持一致**

## 安装

```
pip install "langchain-chatchat[xinference]" -U

# 在一个空目录下创建项目
chatchat init
# 修改好配置后
chatchat kb -r
# 启动服务
chatchat start -a
```

