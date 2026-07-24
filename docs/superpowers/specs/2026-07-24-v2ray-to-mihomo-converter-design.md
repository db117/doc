---
title: V2Ray 订阅转 Mihomo 配置页面设计
description: V2Ray 订阅链接在浏览器本地转换为 Clash Verge Rev 可用 Mihomo YAML 的页面设计。
---

# V2Ray 订阅转 Mihomo 配置页面设计

## 背景与目标

在现有 VitePress 文档站中增加一个在线工具页。用户输入 V2Ray 订阅链接，页面在浏览器本地读取、解析订阅，并生成可直接导入 Clash Verge Rev 的完整 Mihomo YAML 配置。

首版目标：

- 主要面向 Clash Verge Rev 及其内置 Mihomo 内核，不兼容旧版 Clash 内核。
- 支持 `vmess://`、`vless://`、`trojan://` 和 `ss://` 节点。
- 生成节点、代理组、DNS、远程规则提供者和规则列表。
- 提供 YAML 预览、复制和下载 `config.yaml`。
- 订阅 URL、订阅内容、节点凭据和生成结果只存在于当前页面内存中。

首版不包含：

- SSR、TUIC、Hysteria2 及其他协议。
- 后端转换服务、公共 CORS 代理或第三方转换 API。
- 生成可被 Clash Verge Rev 长期订阅并自动更新节点的新 URL。
- 一键导入 Clash Verge Rev。
- 多订阅合并、节点编辑、测速或节点去重。
- DNS、TUN、端口等运行参数的可视化编辑。

源订阅更新后，用户需要重新打开页面、读取订阅并下载配置。页面不会替用户维护可自动更新的转换订阅。

## 方案选择

采用原生 TypeScript 转换器，并在 VitePress Markdown 页面中挂载 Vue 组件。

该方案只为首版四种协议实现必要的解析逻辑，转换全程可审计、无后端依赖。相比引入 subconverter 核心或 WebAssembly，它的包体和构建复杂度更低；相比调用外部转换服务，它不会把订阅信息交给第三方。

允许增加一个专用 YAML 序列化库，避免手工拼接 YAML 造成引号、换行或特殊字符错误。协议解析本身不依赖远程服务。

## 页面位置与代码边界

正式工具页面放在 `docs/other/`，并从 `docs/other/index.md` 的在线工具区域链接。页面使用 frontmatter 设置准确的中文标题、描述和专用 `pageClass`。

实现按职责拆分：

- 页面壳：说明用途、隐私边界、兼容范围并挂载工具组件。
- 工具组件：管理输入、规则选项、状态、错误、预览、复制和下载。
- 订阅读取器：校验 URL、发起请求、处理超时并提供手动粘贴兜底。
- 订阅解码器：处理 BOM、空白、Base64、URL-safe Base64、缺失补位和纯文本节点列表。
- 协议解析器：每种协议一个解析器，输出统一节点模型。
- Mihomo 生成器：生成基础配置、DNS、代理组、规则提供者和规则。
- 输出工具：序列化和校验 YAML，复制文本并下载文件。

协议解析器互不依赖。新增协议时只增加解析器和统一模型映射，不改变页面交互或规则生成器。

工具组件必须兼容 VitePress 的服务端构建。模块加载阶段不得读取 `window`、`document`、剪贴板或下载 API；相关浏览器能力只在组件挂载后或用户触发操作时使用。

## 输入与数据流

页面提供两个输入入口：

1. 默认入口是订阅 URL 和“读取订阅”按钮。
2. 页面也提供“无法读取？手动粘贴”的次级入口；直接读取失败时自动展开该入口。

读取流程：

1. 只接受 `http:` 和 `https:` URL。
2. HTTPS 页面遇到 HTTP 订阅时，不尝试会被浏览器阻止的混合内容请求，直接提示用户打开链接并粘贴内容。
3. 其他 URL 使用浏览器 `fetch` 直接向订阅服务请求，凭据模式设为 `omit`，不向非订阅服务发送数据。
4. 请求超过 15 秒后取消。
5. 成功取得内容后去除 BOM 和首尾空白。
6. 内容若已经包含受支持的 URI 行，直接按纯文本处理；否则尝试把整个响应作为 Base64 或 URL-safe Base64 解码。
7. 按行识别协议并调用对应解析器。
8. 有效节点进入统一模型；无效或不支持的行进入警告列表。
9. 根据规则选项生成配置对象，由 YAML 序列化库输出文本。
10. 重新解析生成的 YAML，并校验代理组和规则引用后才开放复制和下载。

浏览器无法可靠区分所有 CORS 错误和普通网络错误。能够预先识别的混合内容、无效 URL、超时、HTTP 非成功状态分别提示；其余 `fetch` 失败统一说明可能由 CORS 或网络导致，并引导用户使用粘贴入口。

## 协议解析

### 统一节点模型

统一模型至少包含：

- 节点名称、协议类型、服务器和端口。
- 协议身份字段，例如 UUID、密码、加密方式和 Alter ID。
- TLS、SNI、ALPN、客户端指纹、跳过证书验证。
- 网络类型及 TCP、WebSocket、HTTP、gRPC 所需参数。
- VLESS Flow 与 Reality 公钥、Short ID、Spider X 等参数。

所有端口必须是 `1` 至 `65535` 的整数；服务器、身份字段等协议必填项不能为空。节点名称为空时使用“未命名节点”，重复名称按输入顺序追加 ` #2`、` #3`，保证 Mihomo 代理引用唯一且稳定。

### VMess

解析 `vmess://` 后的 Base64 JSON，支持常见的 `add`、`port`、`id`、`aid`、`scy`、`net`、`type`、`host`、`path`、`tls`、`sni`、`alpn` 和 `fp` 字段。

支持 TCP、WebSocket、HTTP 和 gRPC 传输，以及 TLS。无法转换的必需参数会使该节点失败，不猜测或静默修正协议语义。

### VLESS

使用标准 URL 结构解析 UUID、主机、端口、名称和查询参数。支持 TCP、WebSocket、HTTP、gRPC，支持 TLS、Reality、SNI、ALPN、客户端指纹、Flow、Public Key、Short ID 和 Spider X。

### Trojan

使用标准 URL 结构解析密码、主机、端口、名称和查询参数。支持 TCP、WebSocket、HTTP、gRPC、TLS、SNI、ALPN 和客户端指纹。

### Shadowsocks

支持 SIP002 的两种常见形式：Base64 编码的完整 `method:password@host:port`，以及只对用户信息编码的形式。支持 IPv4、域名和带方括号的 IPv6 地址。

首版不转换 Shadowsocks 插件。URI 含 `plugin` 参数时拒绝该节点并显示“不支持 Shadowsocks 插件”，避免生成缺少插件参数、实际不可用的节点。

## 页面与交互

页面按操作顺序分为三个区域。

### 输入订阅

- 订阅 URL 输入框和“读取订阅”主按钮。
- “转换数据仅在当前浏览器页面处理，不经过本站服务器”的说明，并注明浏览器仍需直接请求用户填写的订阅服务。
- “无法读取？手动粘贴”入口。
- 读取失败后保留原 URL，显示“打开订阅地址”链接并展开粘贴框。新标签页链接使用 `noopener` 和 `noreferrer`。
- 读取和转换期间按钮进入忙碌状态，防止重复请求。

### 配置规则

默认预设名为“标准分流”，包含三个选项：

- 广告拦截：默认开启。
- 国内流量：默认直连。
- 未匹配流量：默认代理。

三个选项独立生效。页面不暴露 DNS、TUN、端口和测速地址等高级设置。

### 生成结果

成功后展示总节点数及各协议数量，例如“共识别 18 个节点：VMess 10、VLESS 5、Trojan 2、SS 1”。

警告区域展示无效行号、协议和脱敏后的失败原因，不显示完整 URI、UUID、密码或订阅令牌。有效节点仍可继续生成配置；没有任何有效节点时禁止生成。

结果区域提供：

- 只读 YAML 预览。
- “复制配置”按钮。
- “下载 config.yaml”按钮。
- “配置包含节点凭据，请勿截图或公开分享”的安全提醒。

不提供一键导入按钮。桌面端允许规则选项与结果摘要并排，移动端按输入、规则、结果的顺序显示单列布局。

## Mihomo 配置

### 固定基础配置

生成的配置包含以下固定默认值：

```yaml
mixed-port: 7890
allow-lan: false
mode: rule
log-level: info
ipv6: false
unified-delay: true
tcp-concurrent: true
profile:
  store-selected: true
```

### DNS 默认值

DNS 不在页面中提供编辑，固定生成：

```yaml
dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  proxy-server-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
```

### 代理组

固定生成三个代理组：

- `节点选择`：`select` 类型，依次包含 `自动选择`、`故障转移`、所有节点和 `DIRECT`。
- `自动选择`：`url-test` 类型，包含所有节点。
- `故障转移`：`fallback` 类型，包含所有节点。

自动选择和故障转移均使用 `https://www.gstatic.com/generate_204` 检测，每 300 秒检测一次。`节点选择` 是所有代理规则引用的唯一入口，使用户可以在 Clash Verge Rev 中随时切换手动节点、自动选择或故障转移。

### 规则提供者

规则来自 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat) 的 `meta` 分支：

| 名称 | 类型 | 地址 |
| --- | --- | --- |
| `private` | domain | `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.mrs` |
| `ads` | domain | `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ads-all.mrs` |
| `cn-domain` | domain | `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.mrs` |
| `non-cn` | domain | `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/geolocation-!cn.mrs` |
| `cn-ip` | ipcidr | `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.mrs` |

每个提供者使用 `type: http`、`format: mrs` 和 `interval: 86400`，并写入独立的本地缓存路径。

`interval: 86400` 表示 Mihomo 在配置运行期间每 24 小时尝试刷新规则。上游项目当前通过 GitHub Actions 每天北京时间 06:30 构建规则；网页自身没有定时更新任务。刷新失败时由 Mihomo 继续使用已有缓存。

广告拦截关闭时不生成 `ads` 提供者，避免下载未使用规则。其他提供者始终生成，因为三个规则选项组合都可能引用它们。

### 规则顺序

规则顺序固定：

1. `RULE-SET,private,DIRECT`
2. 广告拦截开启时：`RULE-SET,ads,REJECT`
3. `cn-domain` 规则：国内直连开启时走 `DIRECT`，关闭时走 `节点选择`。
4. `cn-ip` 规则：与国内域名使用相同策略，并追加 `no-resolve`。
5. `RULE-SET,non-cn,节点选择`
6. `MATCH`：未匹配流量选择代理时走 `节点选择`，选择直连时走 `DIRECT`。

除上述策略目标外，规则名称与顺序不随选项变化。

## 隐私与安全

- 订阅 URL、原始内容、解析后的节点和 YAML 不写入 `localStorage`、`sessionStorage`、IndexedDB、Cookie、分析事件或控制台。
- 页面只向用户输入的订阅 URL 发起读取请求。生成 YAML 时不下载规则文件；规则由 Mihomo 导入配置后获取。
- 页面刷新、关闭或离开后，所有转换数据随内存状态销毁。
- 错误信息只保留行号、协议和错误类型，不回显完整凭据。
- 页面不使用公共 CORS 代理；CORS 受限时只能切换到手动粘贴。
- Baidu 统计脚本属于站点现有全局配置，但工具组件不得主动把订阅或节点数据写入页面 URL、DOM 属性、分析事件或日志。安全说明明确指出页面仍会加载站点既有的第三方统计脚本。

## 错误处理

### 阻止生成的错误

- URL 不是 `http:` 或 `https:`。
- 订阅内容为空。
- 内容既不是支持的节点列表，也不能解码为节点列表。
- 没有任何有效节点。
- YAML 序列化或回读失败。
- 代理组引用不存在的节点，或规则引用不存在的代理组、规则提供者。

### 可继续生成的警告

- 单个节点 URI 损坏。
- 遇到首版不支持的协议。
- 节点缺少必填字段或端口越界。
- 遇到不支持的传输参数或 Shadowsocks 插件。
- 节点名称重复并被自动改名。

复制失败时保留预览和下载；下载失败时保留预览和复制。任何输出操作失败都不会清除已解析结果。

## 验证策略

### 单元测试

使用固定、虚构的测试凭据覆盖：

- VMess、VLESS、Trojan、Shadowsocks 的基础形式。
- TCP、WebSocket、HTTP、gRPC、TLS 和 Reality 的支持组合。
- 标准 Base64、URL-safe Base64、缺少补位、BOM、CRLF 和空行。
- 中文、Emoji、空名称和重复名称。
- IPv4、域名、IPv6 和端口边界。
- 损坏 URI、混合有效与无效节点、空订阅和不支持协议。
- 三个规则选项的全部八种组合。
- 配置序列化、YAML 回读、代理组引用和规则引用完整性。

### 页面验证

- URL 校验、加载状态、15 秒超时和 HTTP 错误。
- HTTPS 页面输入 HTTP 订阅时直接显示粘贴兜底。
- 模拟 `fetch` 失败后展开粘贴入口。
- 部分节点失败时统计、脱敏警告和生成结果正确。
- 复制、下载、清空状态及刷新后不保留数据。
- 桌面与移动端布局、键盘操作、焦点状态和深浅色主题。

### 构建与验收

- 运行相关单元测试。
- 运行 `npm run docs:build`。
- 使用虚构订阅在本地页面完成链接读取和粘贴两条流程。
- 将生成文件导入 Clash Verge Rev，确认 Mihomo 接受配置、三个代理组可用、远程规则能下载并按开关生效。

## 验收标准

- 用户可以从订阅 URL 开始完成转换；CORS 受限时可以通过粘贴内容完成同一流程。
- 四种首版协议的有效节点被正确转换，支持范围外的内容得到明确、脱敏的提示。
- 默认生成“广告拦截、国内直连、未匹配代理”的完整 Mihomo 配置。
- 用户可以独立修改三个规则选项，并得到引用完整、语法有效的 YAML。
- 结果可以预览、复制和下载，并可被 Clash Verge Rev 导入使用。
- 页面不持久化或主动上报任何订阅与节点数据。
