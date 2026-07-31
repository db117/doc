---
title: 期权策略构建器本地使用指南
description: 安装并登录 Futu OpenD，启动本地 futu_bridge，并连接美股期权策略构建器。
---

# 期权策略构建器本地使用指南

本指南用于准备[美股期权策略构建器](./options-strategy.md)所需的本地行情环境。

## 工作方式

策略页面部署在网站上，但行情数据不会经过网站服务器。浏览器只会访问你电脑上的 `futu_bridge`，再由 Bridge 查询本机 OpenD：

```text
策略页面
  │ HTTP JSON
  ▼
127.0.0.1:8765  futu_bridge
  │ futu-api
  ▼
127.0.0.1:11111 Futu OpenD
```

完整的 Bridge 源码和接口文档见 [trade-ai/futu_bridge](https://github.com/db117/trade-ai/tree/main/futu_bridge)。

## 首次安装

### 1. 安装并登录 Futu OpenD

富途相关软件、账号和行情权限需要自行准备：

1. 按 [Futu OpenAPI 官方 AI 文档](https://openapi.futunn.com/futu-api-doc/intro/ai.html)安装并配置 Futu OpenD。
2. 启动 OpenD，并登录自己的富途账号。
3. 保持 OpenD 运行，默认监听地址为 `127.0.0.1:11111`。
4. 确认账号具有美股及美股期权行情权限，否则部分报价、IV 或 Greeks 可能无法获取。

本站不提供富途软件、富途账号、登录服务或行情权限。

### 2. 下载本地 Bridge

需要安装 Git 和 Python 3.10 或更高版本，然后执行：

```bash
git clone https://github.com/db117/trade-ai.git
cd trade-ai
```

如果已经下载过项目，进入项目根目录并拉取最新代码：

```bash
cd trade-ai
git pull
```

### 3. 创建 Python 环境

macOS 或 Linux：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install futu-api
```

Windows PowerShell：

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install futu-api
```

确认 Futu Python SDK 已正确安装：

```bash
python -c "import futu; print(futu.__version__)"
```

### 4. 启动 Bridge

确保当前目录是 `trade-ai` 仓库根目录，并且 OpenD 已启动和登录：

```bash
python -m futu_bridge
```

启动成功后会看到：

```text
Futu bridge listening on http://127.0.0.1:8765 (OpenD 127.0.0.1:11111)
```

Bridge 只创建行情查询上下文，不创建交易上下文，也不提供下单、改单或撤单接口。按 `Ctrl+C` 可以停止服务。

### 5. 检查本地连接

在终端运行：

```bash
curl http://127.0.0.1:8765/health
```

也可以直接在浏览器打开 <http://127.0.0.1:8765/health>。正常返回示例：

```json
{
  "status": "ok",
  "opend": "127.0.0.1:11111"
}
```

打开[美股期权策略构建器](./options-strategy.md)，进入“连接设置”，确认 Bridge 地址为：

```text
http://127.0.0.1:8765
```

然后点击重新连接或刷新行情。

## 以后每次使用

不需要重复安装，只需按以下顺序启动：

1. 启动 Futu OpenD 并登录。
2. 在 `trade-ai` 根目录激活 Python 虚拟环境。
3. 运行 `python -m futu_bridge`。
4. 打开策略构建器并确认本地行情已连接。

## 常见问题

| 现象                           | 检查方式                                                         |
|--------------------------------|------------------------------------------------------------------|
| 页面提示无法连接 Bridge        | 先打开 `http://127.0.0.1:8765/health`，确认本地 Bridge 正在运行  |
| Bridge 已启动，但查询返回错误  | 确认 OpenD 已启动、已登录，并监听 `127.0.0.1:11111`              |
| 能连接但缺少报价、IV 或 Greeks | 检查富途账号是否具有对应市场和期权行情权限                       |
| 提示无法导入 `futu`            | 在当前 Python 环境运行 `python -m pip install futu-api`          |
| 修改了 Bridge 端口             | 在策略页面“连接设置”中填写相同端口，例如 `http://127.0.0.1:9000` |
