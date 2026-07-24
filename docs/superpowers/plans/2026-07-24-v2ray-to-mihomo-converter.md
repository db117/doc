---
title: V2Ray 订阅转 Mihomo 配置页面实现计划
description: 在 VitePress 中实现纯前端 V2Ray 订阅转换工具的测试驱动实施步骤。
---

# V2Ray to Mihomo Converter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 VitePress 文档站中增加一个纯前端工具，将 V2Ray 订阅链接或粘贴内容转换为 Clash Verge Rev 可导入的完整 Mihomo YAML 配置。

**Architecture:** 用独立 TypeScript 模块完成订阅读取、Base64 解码、四种协议解析、统一节点建模和 Mihomo 配置生成，Vue 单文件组件只管理页面状态与浏览器交互。所有核心模块在 Node 环境下由 Vitest 验证，浏览器 API 仅在用户操作时调用，确保 VitePress 服务端构建安全。

**Tech Stack:** VitePress 2、Vue 3、TypeScript、Vitest 4.1、`yaml` 2.9、浏览器 Fetch/Clipboard/Blob API。

## Global Constraints

- 目标客户端仅为 Clash Verge Rev 及其 Mihomo 内核，不兼容旧版 Clash。
- 首版只支持 `vmess://`、`vless://`、`trojan://`、`ss://`；不支持 SSR、TUIC、Hysteria2。
- 转换不经过本站后端、公共 CORS 代理或第三方转换 API；浏览器只直接请求用户填写的订阅 URL。
- 订阅 URL、原始内容、节点和 YAML 只保存在组件内存中，不写入存储、页面 URL、控制台或分析事件。
- URL 请求超时固定为 15 秒；HTTPS 页面输入 HTTP URL 时直接进入手动粘贴兜底。
- 页面不生成可自动更新节点的新订阅 URL；源订阅更新后需要用户重新转换。
- 默认规则为广告拦截开启、国内流量直连、未匹配流量代理；三个选项可独立修改。
- 固定生成 `节点选择`、`自动选择`、`故障转移` 三个代理组，不提供一键导入。
- 规则使用 MetaCubeX `meta-rules-dat` 的 MRS 文件，`interval` 固定为 `86400`。
- 输出只提供 YAML 预览、复制和下载 `config.yaml`。
- 新增和修改的 Markdown 必须包含 `title` frontmatter；完成后必须运行 `npm test` 和 `npm run docs:build`。
- 设计依据：`docs/superpowers/specs/2026-07-24-v2ray-to-mihomo-converter-design.md`。

---

## File Structure

### Core conversion modules

- Create `docs/.vitepress/theme/v2ray-to-mihomo/types.ts`: 统一节点、TLS、传输、解析结果和规则选项类型。
- Create `docs/.vitepress/theme/v2ray-to-mihomo/codec.ts`: 浏览器安全的 Base64 与订阅文本解码。
- Create `docs/.vitepress/theme/v2ray-to-mihomo/parsers/errors.ts`: 脱敏解析错误类型。
- Create `docs/.vitepress/theme/v2ray-to-mihomo/parsers/url-options.ts`: VLESS/Trojan 共用 URL、传输和 TLS 参数解析。
- Create `docs/.vitepress/theme/v2ray-to-mihomo/parsers/vmess.ts`: VMess Base64 JSON 解析。
- Create `docs/.vitepress/theme/v2ray-to-mihomo/parsers/vless.ts`: VLESS URL 解析。
- Create `docs/.vitepress/theme/v2ray-to-mihomo/parsers/trojan.ts`: Trojan URL 解析。
- Create `docs/.vitepress/theme/v2ray-to-mihomo/parsers/shadowsocks.ts`: SIP002 Shadowsocks 解析。
- Create `docs/.vitepress/theme/v2ray-to-mihomo/parse-subscription.ts`: 协议分发、警告、名称去重和统计。
- Create `docs/.vitepress/theme/v2ray-to-mihomo/fetch-subscription.ts`: URL 校验、混合内容检测、超时和 Fetch 错误分类。
- Create `docs/.vitepress/theme/v2ray-to-mihomo/mihomo-config.ts`: 节点映射、DNS、代理组、规则、YAML 序列化和引用校验。

### UI and documentation

- Create `docs/.vitepress/theme/v2ray-to-mihomo/V2rayToMihomo.vue`: 工具交互、状态、预览、复制与下载。
- Create `docs/other/v2ray-to-clash.md`: 带 frontmatter 的正式工具页面。
- Modify `docs/other/index.md`: 增加在线工具入口。
- Modify `docs/.vitepress/theme/style.css`: 放宽工具页内容宽度，不影响其他文档。

### Tests and project setup

- Create `tests/v2ray-to-mihomo/codec.test.ts`.
- Create `tests/v2ray-to-mihomo/vmess.test.ts`.
- Create `tests/v2ray-to-mihomo/vless.test.ts`.
- Create `tests/v2ray-to-mihomo/trojan.test.ts`.
- Create `tests/v2ray-to-mihomo/shadowsocks.test.ts`.
- Create `tests/v2ray-to-mihomo/parse-subscription.test.ts`.
- Create `tests/v2ray-to-mihomo/fetch-subscription.test.ts`.
- Create `tests/v2ray-to-mihomo/mihomo-config.test.ts`.
- Modify `package.json` and `package-lock.json`: 增加 `vitest`、`yaml` 和 `test` 脚本。

---

### Task 1: Test Harness, Shared Types, and Subscription Codec

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/types.ts`
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/codec.ts`
- Create: `tests/v2ray-to-mihomo/codec.test.ts`

**Interfaces:**
- Consumes: none.
- Produces: `ProxyNode`, `Protocol`, `NetworkType`, `TlsOptions`, `TransportOptions`, `ParseWarning`, `ParseSubscriptionResult`, `RuleOptions`, `DEFAULT_RULE_OPTIONS`, `decodeBase64Utf8(input: string): string`, `decodeSubscriptionLines(input: string): string[]`.

- [ ] **Step 1: Install the two pinned development dependencies and add the test script**

Run:

```bash
npm install --save-dev vitest@^4.1.10 yaml@^2.9.0
npm pkg set scripts.test="vitest run"
```

Expected: `package.json` contains `"test": "vitest run"`; `package-lock.json` records Vitest 4.1 and YAML 2.9.

- [ ] **Step 2: Write failing codec tests**

Create `tests/v2ray-to-mihomo/codec.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  SubscriptionDecodeError,
  decodeBase64Utf8,
  decodeSubscriptionLines,
} from '../../docs/.vitepress/theme/v2ray-to-mihomo/codec'

describe('subscription codec', () => {
  it('decodes standard and URL-safe Base64 without padding', () => {
    const source = 'vmess://first\nvless://第二个'
    const standard = Buffer.from(source, 'utf8').toString('base64')
    const urlSafe = standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    expect(decodeBase64Utf8(standard)).toBe(source)
    expect(decodeBase64Utf8(urlSafe)).toBe(source)
  })

  it('keeps URI lines and removes BOM, CRLF, and blank lines', () => {
    const input = '\uFEFFvmess://one\r\n\r\nssr://unsupported\r\nvless://two\r\n'
    expect(decodeSubscriptionLines(input)).toEqual([
      'vmess://one',
      'ssr://unsupported',
      'vless://two',
    ])
  })

  it('decodes an entire Base64 subscription', () => {
    const encoded = Buffer.from('trojan://one\nss://two', 'utf8').toString('base64')
    expect(decodeSubscriptionLines(encoded)).toEqual(['trojan://one', 'ss://two'])
  })

  it('rejects empty or undecodable content', () => {
    expect(() => decodeSubscriptionLines('  ')).toThrow(SubscriptionDecodeError)
    expect(() => decodeSubscriptionLines('not a subscription')).toThrow(SubscriptionDecodeError)
  })
})
```

- [ ] **Step 3: Run the codec test and confirm it fails for the missing module**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/codec.test.ts
```

Expected: FAIL because `codec.ts` does not exist.

- [ ] **Step 4: Define the shared discriminated union and result types**

Create `docs/.vitepress/theme/v2ray-to-mihomo/types.ts` with these exact public types:

```ts
export type Protocol = 'vmess' | 'vless' | 'trojan' | 'ss'
export type NetworkType = 'tcp' | 'ws' | 'http' | 'grpc'

export interface TlsOptions {
  security: 'tls' | 'reality'
  serverName?: string
  alpn?: string[]
  clientFingerprint?: string
  skipCertVerify?: boolean
  reality?: {
    publicKey: string
    shortId?: string
    spiderX?: string
  }
}

export interface TransportOptions {
  network: NetworkType
  ws?: { path: string; host?: string }
  http?: { path: string; host?: string }
  grpc?: { serviceName: string }
}

interface BaseNode {
  name: string
  server: string
  port: number
  transport: TransportOptions
  tls?: TlsOptions
}

export interface VmessNode extends BaseNode {
  type: 'vmess'
  uuid: string
  alterId: number
  cipher: string
}

export interface VlessNode extends BaseNode {
  type: 'vless'
  uuid: string
  flow?: string
}

export interface TrojanNode extends BaseNode {
  type: 'trojan'
  password: string
}

export interface ShadowsocksNode extends BaseNode {
  type: 'ss'
  cipher: string
  password: string
}

export type ProxyNode = VmessNode | VlessNode | TrojanNode | ShadowsocksNode

export interface ParseWarning {
  line: number
  protocol: string
  code: string
  message: string
}

export interface ParseSubscriptionResult {
  nodes: ProxyNode[]
  warnings: ParseWarning[]
  counts: Record<Protocol, number>
}

export interface RuleOptions {
  blockAds: boolean
  directChina: boolean
  unmatched: 'proxy' | 'direct'
}

export const DEFAULT_RULE_OPTIONS: RuleOptions = {
  blockAds: true,
  directChina: true,
  unmatched: 'proxy',
}
```

- [ ] **Step 5: Implement the browser-safe codec**

Create `docs/.vitepress/theme/v2ray-to-mihomo/codec.ts`:

```ts
const URI_LINE = /^[a-z][a-z0-9+.-]*:\/\//i

export class SubscriptionDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SubscriptionDecodeError'
  }
}

export function decodeBase64Utf8(input: string): string {
  const compact = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (!compact || /[^A-Za-z0-9+/=]/.test(compact)) {
    throw new SubscriptionDecodeError('订阅内容不是有效的 Base64')
  }

  const padded = compact.padEnd(compact.length + ((4 - (compact.length % 4)) % 4), '=')
  try {
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new SubscriptionDecodeError('订阅内容不是有效的 UTF-8 Base64')
  }
}

function nonEmptyLines(input: string): string[] {
  return input.replace(/^\uFEFF/, '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
}

export function decodeSubscriptionLines(input: string): string[] {
  const trimmed = input.replace(/^\uFEFF/, '').trim()
  if (!trimmed) throw new SubscriptionDecodeError('订阅内容为空')

  const directLines = nonEmptyLines(trimmed)
  if (directLines.some(line => URI_LINE.test(line))) return directLines

  const decodedLines = nonEmptyLines(decodeBase64Utf8(trimmed))
  if (!decodedLines.some(line => URI_LINE.test(line))) {
    throw new SubscriptionDecodeError('未找到节点链接')
  }
  return decodedLines
}
```

- [ ] **Step 6: Run the codec test**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/codec.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 7: Commit the test foundation and codec**

```bash
git add package.json package-lock.json docs/.vitepress/theme/v2ray-to-mihomo/types.ts docs/.vitepress/theme/v2ray-to-mihomo/codec.ts tests/v2ray-to-mihomo/codec.test.ts
git commit -m "test: add subscription codec foundation"
```

---

### Task 2: VMess Parser

**Files:**
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/parsers/errors.ts`
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/parsers/vmess.ts`
- Create: `tests/v2ray-to-mihomo/vmess.test.ts`

**Interfaces:**
- Consumes: `VmessNode`, `NetworkType`, `decodeBase64Utf8()` from Task 1.
- Produces: `NodeParseError`, `parseVmessUri(uri: string): VmessNode`.

- [ ] **Step 1: Write failing VMess tests**

Create `tests/v2ray-to-mihomo/vmess.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseVmessUri } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/vmess'

function vmessUri(payload: Record<string, unknown>): string {
  return `vmess://${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')}`
}

describe('parseVmessUri', () => {
  it('parses WebSocket TLS fields and a Unicode name', () => {
    const node = parseVmessUri(vmessUri({
      v: '2', ps: '香港 🚀', add: 'edge.example.com', port: '443',
      id: '11111111-1111-4111-8111-111111111111', aid: '0', scy: 'auto',
      net: 'ws', host: 'cdn.example.com', path: '/socket', tls: 'tls',
      sni: 'cdn.example.com', alpn: 'h2,http/1.1', fp: 'chrome',
    }))

    expect(node).toMatchObject({
      type: 'vmess', name: '香港 🚀', server: 'edge.example.com', port: 443,
      uuid: '11111111-1111-4111-8111-111111111111', alterId: 0, cipher: 'auto',
      transport: { network: 'ws', ws: { path: '/socket', host: 'cdn.example.com' } },
      tls: {
        security: 'tls', serverName: 'cdn.example.com',
        alpn: ['h2', 'http/1.1'], clientFingerprint: 'chrome',
      },
    })
  })

  it('rejects missing identity and out-of-range ports without echoing the URI', () => {
    const uri = vmessUri({ ps: 'bad', add: 'host.example', port: '70000', id: '' })
    expect(() => parseVmessUri(uri)).toThrow('端口必须在 1 到 65535 之间')
  })

  it('maps TCP, HTTP, and gRPC transports', () => {
    const base = {
      ps: 'transport', add: 'edge.example.com', port: '443',
      id: '11111111-1111-4111-8111-111111111111', aid: '0',
    }
    expect(parseVmessUri(vmessUri({ ...base, net: 'tcp' })).transport)
      .toEqual({ network: 'tcp' })
    expect(parseVmessUri(vmessUri({ ...base, net: 'http', path: '/h2', host: 'h2.example.com' })).transport)
      .toEqual({ network: 'http', http: { path: '/h2', host: 'h2.example.com' } })
    expect(parseVmessUri(vmessUri({ ...base, net: 'grpc', path: 'tunnel' })).transport)
      .toEqual({ network: 'grpc', grpc: { serviceName: 'tunnel' } })
  })
})
```

- [ ] **Step 2: Run the VMess test and confirm it fails**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/vmess.test.ts
```

Expected: FAIL because `parsers/vmess.ts` does not exist.

- [ ] **Step 3: Add the safe parser error type**

Create `docs/.vitepress/theme/v2ray-to-mihomo/parsers/errors.ts`:

```ts
export class NodeParseError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'NodeParseError'
  }
}

export function parsePort(value: string | number): number {
  const port = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new NodeParseError('invalid-port', '端口必须在 1 到 65535 之间')
  }
  return port
}

export function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NodeParseError('missing-field', `缺少必填字段：${field}`)
  }
  return value.trim()
}
```

- [ ] **Step 4: Implement the VMess mapping**

Create `docs/.vitepress/theme/v2ray-to-mihomo/parsers/vmess.ts`. Decode JSON with `decodeBase64Utf8()`, validate `add`、`port`、`id`, default `ps` to `未命名节点`, default `aid` to `0`, default `scy` to `auto`, and map transports exactly as follows:

```ts
const SUPPORTED_NETWORKS = new Set(['tcp', 'ws', 'http', 'grpc'])

function transportOf(data: Record<string, unknown>): TransportOptions {
  const network = String(data.net || 'tcp') as NetworkType
  if (!SUPPORTED_NETWORKS.has(network)) {
    throw new NodeParseError('unsupported-transport', `不支持的传输类型：${network}`)
  }
  const path = typeof data.path === 'string' ? data.path : ''
  const host = typeof data.host === 'string' && data.host ? data.host : undefined
  if (network === 'ws') return { network, ws: { path: path || '/', host } }
  if (network === 'http') return { network, http: { path: path || '/', host } }
  if (network === 'grpc') return { network, grpc: { serviceName: path } }
  return { network: 'tcp' }
}
```

For TLS, create `tls` only when `data.tls === 'tls'`; split comma-separated `alpn`, copy `sni` and `fp`, and map `allowInsecure` values `true`、`1`、`"true"`、`"1"` to `skipCertVerify: true`. Catch JSON failures and throw `new NodeParseError('invalid-vmess-json', 'VMess 内容不是有效的 JSON')`. Never include the source URI in an error.

- [ ] **Step 5: Run the VMess tests**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/vmess.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 6: Commit the VMess parser**

```bash
git add docs/.vitepress/theme/v2ray-to-mihomo/parsers tests/v2ray-to-mihomo/vmess.test.ts
git commit -m "feat: parse vmess subscription nodes"
```

---

### Task 3: Shared URL Options and VLESS Parser

**Files:**
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/parsers/url-options.ts`
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/parsers/vless.ts`
- Create: `tests/v2ray-to-mihomo/vless.test.ts`

**Interfaces:**
- Consumes: `VlessNode`, `NetworkType`, `TransportOptions`, `TlsOptions`, `NodeParseError`, `parsePort()`.
- Produces: `parseUrlNode(uri: string, protocol: 'vless' | 'trojan'): ParsedUrlNode`, `parseTransport(params: URLSearchParams): TransportOptions`, `parseTls(params: URLSearchParams): TlsOptions | undefined`, `parseVlessUri(uri: string): VlessNode`.

- [ ] **Step 1: Write failing VLESS tests for TCP Reality and WebSocket TLS**

Create `tests/v2ray-to-mihomo/vless.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseVlessUri } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/vless'

describe('parseVlessUri', () => {
  it('parses TCP Reality options', () => {
    const uri = 'vless://11111111-1111-4111-8111-111111111111@edge.example.com:443' +
      '?encryption=none&security=reality&type=tcp' +
      '&sni=www.cloudflare.com&fp=chrome&pbk=public-key&sid=abcd&spx=%2F' +
      '&flow=xtls-rprx-vision#Reality%20HK'
    expect(parseVlessUri(uri)).toEqual({
      type: 'vless', name: 'Reality HK', server: 'edge.example.com', port: 443,
      uuid: '11111111-1111-4111-8111-111111111111', flow: 'xtls-rprx-vision',
      transport: { network: 'tcp' },
      tls: {
        security: 'reality', serverName: 'www.cloudflare.com', clientFingerprint: 'chrome',
        reality: { publicKey: 'public-key', shortId: 'abcd', spiderX: '/' },
      },
    })
  })

  it('parses WebSocket host and path', () => {
    const uri = 'vless://11111111-1111-4111-8111-111111111111@ws.example.com:443' +
      '?security=tls&type=ws&host=cdn.example.com&path=%2Fws&sni=cdn.example.com#WS'
    expect(parseVlessUri(uri)).toMatchObject({
      name: 'WS', transport: { network: 'ws', ws: { path: '/ws', host: 'cdn.example.com' } },
      tls: { security: 'tls', serverName: 'cdn.example.com' },
    })
  })

  it('defaults to plain TCP when transport and security are absent', () => {
    const uri = 'vless://11111111-1111-4111-8111-111111111111@plain.example.com:80#Plain'
    expect(parseVlessUri(uri)).toMatchObject({
      name: 'Plain', transport: { network: 'tcp' }, tls: undefined,
    })
  })
})
```

- [ ] **Step 2: Run the VLESS tests and confirm they fail**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/vless.test.ts
```

Expected: FAIL because `parsers/vless.ts` does not exist.

- [ ] **Step 3: Implement URL, transport, and TLS helpers**

Create `url-options.ts` with an SSR-safe `new URL(uri)` parser. It must:

```ts
export interface ParsedUrlNode {
  identity: string
  server: string
  port: number
  name: string
  params: URLSearchParams
}

function decodePart(value: string, field: string): string {
  try { return decodeURIComponent(value) } catch {
    throw new NodeParseError('invalid-encoding', `${field} 包含无效的 URL 编码`)
  }
}

export function parseUrlNode(uri: string, protocol: 'vless' | 'trojan'): ParsedUrlNode {
  let url: URL
  try { url = new URL(uri) } catch {
    throw new NodeParseError('invalid-url', `${protocol.toUpperCase()} 链接格式无效`)
  }
  if (url.protocol !== `${protocol}:`) {
    throw new NodeParseError('wrong-protocol', `节点不是 ${protocol.toUpperCase()} 协议`)
  }
  return {
    identity: requireText(decodePart(url.username, protocol === 'vless' ? 'UUID' : '密码'), protocol === 'vless' ? 'UUID' : '密码'),
    server: requireText(url.hostname.replace(/^\[|\]$/g, ''), '服务器'),
    port: parsePort(url.port),
    name: decodePart(url.hash.slice(1), '节点名称') || '未命名节点',
    params: url.searchParams,
  }
}
```

`parseTransport()` accepts only `tcp`、`ws`、`http`、`grpc`. `ws` uses `path` and `host`; `http` uses `path` and `host`; `grpc` uses `serviceName`; absent `type` means `tcp`.

`parseTls()` maps `security=tls` and `security=reality`. It splits `alpn`, reads `sni` and `fp`, maps case-insensitive `allowInsecure=true` or `allowInsecure=1` to `skipCertVerify: true`, and leaves the field absent for `false`、`0` or a missing value. For Reality it requires `pbk`, then maps `sid` and `spx`. `security=none` or absent returns `undefined`; any other security value throws `unsupported-security`.

- [ ] **Step 4: Implement VLESS with the shared helpers**

Create `vless.ts`:

```ts
export function parseVlessUri(uri: string): VlessNode {
  const parsed = parseUrlNode(uri, 'vless')
  const flow = parsed.params.get('flow') || undefined
  return {
    type: 'vless',
    name: parsed.name,
    server: parsed.server,
    port: parsed.port,
    uuid: parsed.identity,
    flow,
    transport: parseTransport(parsed.params),
    tls: parseTls(parsed.params),
  }
}
```

- [ ] **Step 5: Run the VLESS tests**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/vless.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 6: Commit VLESS parsing**

```bash
git add docs/.vitepress/theme/v2ray-to-mihomo/parsers/url-options.ts docs/.vitepress/theme/v2ray-to-mihomo/parsers/vless.ts tests/v2ray-to-mihomo/vless.test.ts
git commit -m "feat: parse vless subscription nodes"
```

---

### Task 4: Trojan Parser

**Files:**
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/parsers/trojan.ts`
- Create: `tests/v2ray-to-mihomo/trojan.test.ts`

**Interfaces:**
- Consumes: `TrojanNode`, `parseUrlNode()`, `parseTransport()`, `parseTls()`.
- Produces: `parseTrojanUri(uri: string): TrojanNode`.

- [ ] **Step 1: Write failing Trojan tests**

Create `tests/v2ray-to-mihomo/trojan.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseTrojanUri } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/trojan'

describe('parseTrojanUri', () => {
  it('parses password, WebSocket, TLS, ALPN, and fingerprint', () => {
    const uri = 'trojan://secret%3Apass@trojan.example.com:443' +
      '?security=tls&type=ws&host=cdn.example.com&path=%2Ftrojan' +
      '&sni=cdn.example.com&alpn=h2%2Chttp%2F1.1&fp=chrome#Trojan%20US'
    expect(parseTrojanUri(uri)).toEqual({
      type: 'trojan', name: 'Trojan US', server: 'trojan.example.com', port: 443,
      password: 'secret:pass',
      transport: { network: 'ws', ws: { path: '/trojan', host: 'cdn.example.com' } },
      tls: {
        security: 'tls', serverName: 'cdn.example.com',
        alpn: ['h2', 'http/1.1'], clientFingerprint: 'chrome',
      },
    })
  })

  it('rejects a missing password', () => {
    expect(() => parseTrojanUri('trojan://@host.example:443#bad')).toThrow('缺少必填字段：密码')
  })

  it('defaults to TCP with TLS when options are absent', () => {
    expect(parseTrojanUri('trojan://secret@host.example:443#Default')).toMatchObject({
      transport: { network: 'tcp' }, tls: { security: 'tls' },
    })
  })
})
```

- [ ] **Step 2: Run the Trojan tests and confirm they fail**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/trojan.test.ts
```

Expected: FAIL because `parsers/trojan.ts` does not exist.

- [ ] **Step 3: Implement Trojan as a thin adapter**

Create `trojan.ts`:

```ts
export function parseTrojanUri(uri: string): TrojanNode {
  const parsed = parseUrlNode(uri, 'trojan')
  return {
    type: 'trojan',
    name: parsed.name,
    server: parsed.server,
    port: parsed.port,
    password: parsed.identity,
    transport: parseTransport(parsed.params),
    tls: parseTls(parsed.params) ?? { security: 'tls' },
  }
}
```

The fallback TLS value reflects Trojan's secure default. Preserve explicit SNI and transport parameters from the shared helpers.

- [ ] **Step 4: Run the Trojan tests**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/trojan.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit Trojan parsing**

```bash
git add docs/.vitepress/theme/v2ray-to-mihomo/parsers/trojan.ts tests/v2ray-to-mihomo/trojan.test.ts
git commit -m "feat: parse trojan subscription nodes"
```

---

### Task 5: Shadowsocks SIP002 Parser

**Files:**
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/parsers/shadowsocks.ts`
- Create: `tests/v2ray-to-mihomo/shadowsocks.test.ts`

**Interfaces:**
- Consumes: `ShadowsocksNode`, `decodeBase64Utf8()`, `NodeParseError`, `parsePort()`.
- Produces: `parseShadowsocksUri(uri: string): ShadowsocksNode`.

- [ ] **Step 1: Write failing tests for both SIP002 forms and plugin rejection**

Create `tests/v2ray-to-mihomo/shadowsocks.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseShadowsocksUri } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/shadowsocks'

describe('parseShadowsocksUri', () => {
  it('parses a fully Base64-encoded authority', () => {
    const authority = Buffer.from('aes-128-gcm:test-pass@ss.example.com:8388').toString('base64')
    expect(parseShadowsocksUri(`ss://${authority}#SS%20One`)).toEqual({
      type: 'ss', name: 'SS One', server: 'ss.example.com', port: 8388,
      cipher: 'aes-128-gcm', password: 'test-pass', transport: { network: 'tcp' },
    })
  })

  it('parses Base64 userinfo with an IPv6 host', () => {
    const userinfo = Buffer.from('chacha20-ietf-poly1305:p%40ss').toString('base64url')
    expect(parseShadowsocksUri(`ss://${userinfo}@[2001:db8::1]:443#IPv6`)).toMatchObject({
      server: '2001:db8::1', port: 443, cipher: 'chacha20-ietf-poly1305', password: 'p@ss',
    })
  })

  it('rejects plugins rather than dropping their semantics', () => {
    const userinfo = Buffer.from('aes-128-gcm:test-pass').toString('base64url')
    expect(() => parseShadowsocksUri(
      `ss://${userinfo}@ss.example.com:8388?plugin=v2ray-plugin#Plugin`,
    )).toThrow('首版不支持 Shadowsocks 插件')
  })
})
```

- [ ] **Step 2: Run the Shadowsocks tests and confirm they fail**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/shadowsocks.test.ts
```

Expected: FAIL because `parsers/shadowsocks.ts` does not exist.

- [ ] **Step 3: Implement SIP002 splitting from the last `@` and first credential colon**

Create `shadowsocks.ts`. Remove `ss://`, split the fragment and query before decoding, reject a non-empty `plugin` parameter, then support these exact branches:

```ts
function splitCredential(value: string): { cipher: string; password: string } {
  const colon = value.indexOf(':')
  if (colon <= 0 || colon === value.length - 1) {
    throw new NodeParseError('invalid-ss-credential', 'Shadowsocks 缺少加密方式或密码')
  }
  return { cipher: value.slice(0, colon), password: value.slice(colon + 1) }
}

// Full authority form: Base64(method:password@host:port)
// Userinfo form: Base64(method:password)@host:port
const at = authority.lastIndexOf('@')
const decodedAuthority = at === -1 ? decodeBase64Utf8(authority) : authority
const decodedAt = decodedAuthority.lastIndexOf('@')
if (decodedAt <= 0) throw new NodeParseError('invalid-ss-uri', 'Shadowsocks 地址缺少服务器')
```

For the userinfo branch, decode only the substring before `@`. Parse bracketed IPv6 separately from `host:port`; otherwise split host and port at the last colon. Decode the fragment name, default it to `未命名节点`, and always return `transport: { network: 'tcp' }`.

- [ ] **Step 4: Run the Shadowsocks tests**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/shadowsocks.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit Shadowsocks parsing**

```bash
git add docs/.vitepress/theme/v2ray-to-mihomo/parsers/shadowsocks.ts tests/v2ray-to-mihomo/shadowsocks.test.ts
git commit -m "feat: parse shadowsocks subscription nodes"
```

---

### Task 6: Subscription Dispatcher, Safe Warnings, and Unique Names

**Files:**
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/parse-subscription.ts`
- Create: `tests/v2ray-to-mihomo/parse-subscription.test.ts`

**Interfaces:**
- Consumes: `decodeSubscriptionLines()`, all four `parse*Uri()` functions, `NodeParseError`, `ParseSubscriptionResult`.
- Produces: `parseSubscription(input: string): ParseSubscriptionResult`.

- [ ] **Step 1: Write failing dispatcher tests**

Create `tests/v2ray-to-mihomo/parse-subscription.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseSubscription } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parse-subscription'

const vless = 'vless://11111111-1111-4111-8111-111111111111@one.example:443?security=tls#Node'
const trojan = 'trojan://secret@two.example:443?security=tls#Node'
const reserved = 'trojan://secret@three.example:443?security=tls#%E8%87%AA%E5%8A%A8%E9%80%89%E6%8B%A9'

describe('parseSubscription', () => {
  it('decodes, dispatches, counts, renames, and keeps safe warnings', () => {
    const raw = [vless, 'ssr://secret-value', trojan, reserved].join('\n')
    const result = parseSubscription(Buffer.from(raw, 'utf8').toString('base64'))

    expect(result.nodes.map(node => node.name)).toEqual(['Node', 'Node #2', '自动选择 #2'])
    expect(result.counts).toEqual({ vmess: 0, vless: 1, trojan: 2, ss: 0 })
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ line: 2, protocol: 'ssr', code: 'unsupported-protocol' }),
      expect.objectContaining({ line: 3, code: 'renamed-node' }),
      expect.objectContaining({ line: 4, code: 'renamed-node' }),
    ]))
    expect(JSON.stringify(result.warnings)).not.toContain('secret-value')
  })

  it('returns no nodes for an entirely invalid list', () => {
    const result = parseSubscription('ssr://hidden\nnot-a-uri')
    expect(result.nodes).toEqual([])
    expect(result.warnings).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run the dispatcher tests and confirm they fail**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/parse-subscription.test.ts
```

Expected: FAIL because `parse-subscription.ts` does not exist.

- [ ] **Step 3: Implement dispatch without logging source lines**

Create `parse-subscription.ts` with this parser table and reserved-name set:

```ts
const parsers = {
  vmess: parseVmessUri,
  vless: parseVlessUri,
  trojan: parseTrojanUri,
  ss: parseShadowsocksUri,
} satisfies Record<Protocol, (uri: string) => ProxyNode>

const RESERVED_NAMES = new Set([
  'DIRECT', 'REJECT', 'GLOBAL', '节点选择', '自动选择', '故障转移',
])
```

For each non-empty line, derive only the scheme before `://`. Unsupported or missing schemes produce `unsupported-protocol` without storing the line. Catch `NodeParseError` and copy only `code` and `message`; unexpected exceptions become `parse-failed` with `节点格式无效`.

Name allocation must count existing names and reserved names. A first node named `自动选择` becomes `自动选择 #2`; repeated `Node` values become `Node` and `Node #2`. Every rename adds a `renamed-node` warning that contains the final node name but no URI or identity.

Increment `counts` only after a node is accepted and renamed.

- [ ] **Step 4: Run all parser and dispatcher tests**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/codec.test.ts tests/v2ray-to-mihomo/vmess.test.ts tests/v2ray-to-mihomo/vless.test.ts tests/v2ray-to-mihomo/trojan.test.ts tests/v2ray-to-mihomo/shadowsocks.test.ts tests/v2ray-to-mihomo/parse-subscription.test.ts
```

Expected: 18 tests PASS.

- [ ] **Step 5: Commit subscription orchestration**

```bash
git add docs/.vitepress/theme/v2ray-to-mihomo/parse-subscription.ts tests/v2ray-to-mihomo/parse-subscription.test.ts
git commit -m "feat: parse complete subscription payloads"
```

---

### Task 7: Mihomo Config and YAML Generator

**Files:**
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/mihomo-config.ts`
- Create: `tests/v2ray-to-mihomo/mihomo-config.test.ts`

**Interfaces:**
- Consumes: `ProxyNode`, `RuleOptions`, `DEFAULT_RULE_OPTIONS`, `parse()` and `stringify()` from `yaml`.
- Produces: `buildMihomoConfig(nodes: ProxyNode[], options: RuleOptions): Record<string, unknown>`, `generateMihomoYaml(nodes: ProxyNode[], options: RuleOptions): string`, `validateMihomoConfig(config: unknown): void`, `MihomoConfigError`.

- [ ] **Step 1: Write failing config tests for defaults, protocol mapping, and all rule combinations**

Create `tests/v2ray-to-mihomo/mihomo-config.test.ts` with a VLESS Reality fixture and an SS fixture. Assert the exact base settings, DNS, three groups, MRS metadata, and mapping:

```ts
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import {
  generateMihomoYaml,
  validateMihomoConfig,
} from '../../docs/.vitepress/theme/v2ray-to-mihomo/mihomo-config'
import type { ProxyNode, RuleOptions } from '../../docs/.vitepress/theme/v2ray-to-mihomo/types'

const nodes: ProxyNode[] = [
  {
    type: 'vless', name: 'Reality', server: 'edge.example.com', port: 443,
    uuid: '11111111-1111-4111-8111-111111111111', flow: 'xtls-rprx-vision',
    transport: { network: 'tcp' },
    tls: {
      security: 'reality', serverName: 'www.cloudflare.com', clientFingerprint: 'chrome',
      reality: { publicKey: 'public-key', shortId: 'abcd', spiderX: '/' },
    },
  },
  {
    type: 'ss', name: 'SS', server: 'ss.example.com', port: 8388,
    cipher: 'aes-128-gcm', password: 'test-pass', transport: { network: 'tcp' },
  },
  {
    type: 'vmess', name: 'VMess WS', server: 'vmess.example.com', port: 443,
    uuid: '22222222-2222-4222-8222-222222222222', alterId: 0, cipher: 'auto',
    transport: { network: 'ws', ws: { path: '/socket', host: 'cdn.example.com' } },
    tls: { security: 'tls', serverName: 'cdn.example.com' },
  },
  {
    type: 'trojan', name: 'Trojan gRPC', server: 'trojan.example.com', port: 443,
    password: 'trojan-pass', transport: { network: 'grpc', grpc: { serviceName: 'tunnel' } },
    tls: { security: 'tls', serverName: 'trojan.example.com' },
  },
]

describe('generateMihomoYaml', () => {
  it('generates a complete default Mihomo configuration', () => {
    const config = parse(generateMihomoYaml(nodes, {
      blockAds: true, directChina: true, unmatched: 'proxy',
    }))

    expect(config).toMatchObject({
      'mixed-port': 7890, 'allow-lan': false, mode: 'rule', ipv6: false,
      'unified-delay': true, 'tcp-concurrent': true,
      profile: { 'store-selected': true },
      dns: { enable: true, 'enhanced-mode': 'fake-ip', 'fake-ip-range': '198.18.0.1/16' },
    })
    expect(config.proxies[0]).toMatchObject({
      name: 'Reality', type: 'vless', tls: true, flow: 'xtls-rprx-vision',
      'client-fingerprint': 'chrome',
      'reality-opts': { 'public-key': 'public-key', 'short-id': 'abcd', 'spider-x': '/' },
    })
    expect(config.proxies[2]).toMatchObject({
      name: 'VMess WS', type: 'vmess', alterId: 0, cipher: 'auto', network: 'ws',
      'ws-opts': { path: '/socket', headers: { Host: 'cdn.example.com' } },
    })
    expect(config.proxies[3]).toMatchObject({
      name: 'Trojan gRPC', type: 'trojan', password: 'trojan-pass', network: 'grpc',
      'grpc-opts': { 'grpc-service-name': 'tunnel' },
    })
    expect(config['proxy-groups'].map((group: { name: string }) => group.name))
      .toEqual(['节点选择', '自动选择', '故障转移'])
    expect(config.rules).toEqual([
      'RULE-SET,private,DIRECT',
      'RULE-SET,ads,REJECT',
      'RULE-SET,cn-domain,DIRECT',
      'RULE-SET,cn-ip,DIRECT,no-resolve',
      'RULE-SET,non-cn,节点选择',
      'MATCH,节点选择',
    ])
  })

  const combinations: RuleOptions[] = [
    { blockAds: true, directChina: true, unmatched: 'proxy' },
    { blockAds: true, directChina: true, unmatched: 'direct' },
    { blockAds: true, directChina: false, unmatched: 'proxy' },
    { blockAds: true, directChina: false, unmatched: 'direct' },
    { blockAds: false, directChina: true, unmatched: 'proxy' },
    { blockAds: false, directChina: true, unmatched: 'direct' },
    { blockAds: false, directChina: false, unmatched: 'proxy' },
    { blockAds: false, directChina: false, unmatched: 'direct' },
  ]

  it.each(combinations)('keeps references valid for %o', options => {
    const config = parse(generateMihomoYaml(nodes, options))
    expect(Boolean(config['rule-providers'].ads)).toBe(options.blockAds)
    expect(config.rules.at(-1)).toBe(`MATCH,${options.unmatched === 'proxy' ? '节点选择' : 'DIRECT'}`)
    expect(config.rules[2 - Number(!options.blockAds)]).toBe(
      `RULE-SET,cn-domain,${options.directChina ? 'DIRECT' : '节点选择'}`,
    )
  })

  it('rejects an empty node list', () => {
    expect(() => generateMihomoYaml([], {
      blockAds: true, directChina: true, unmatched: 'proxy',
    })).toThrow('至少需要一个有效节点')
  })

  it('rejects proxy names that collide with groups or Mihomo built-ins', () => {
    const collision = [{ ...nodes[1], name: 'DIRECT' }] as ProxyNode[]
    expect(() => generateMihomoYaml(collision, {
      blockAds: true, directChina: true, unmatched: 'proxy',
    })).toThrow('节点名称与内置策略冲突')
  })

  it('rejects dangling proxy-group references', () => {
    expect(() => validateMihomoConfig({
      proxies: [{ name: 'Node' }],
      'proxy-groups': [{ name: '节点选择', proxies: ['Missing'] }],
      'rule-providers': {},
      rules: ['MATCH,节点选择'],
    })).toThrow('代理组引用不存在的节点或策略')
  })
})
```

- [ ] **Step 2: Run the config tests and confirm they fail**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/mihomo-config.test.ts
```

Expected: FAIL because `mihomo-config.ts` does not exist.

- [ ] **Step 3: Implement exact node-to-Mihomo mapping**

Create `mihomo-config.ts`. `toMihomoProxy(node)` must start with `{ name, type, server, port, udp: true }`, add protocol identity fields, and map transports:

```ts
if (node.transport.network !== 'tcp') result.network = node.transport.network
if (node.transport.ws) {
  result['ws-opts'] = {
    path: node.transport.ws.path,
    ...(node.transport.ws.host ? { headers: { Host: node.transport.ws.host } } : {}),
  }
}
if (node.transport.http) {
  result['http-opts'] = {
    method: 'GET', path: [node.transport.http.path],
    ...(node.transport.http.host ? { headers: { Host: [node.transport.http.host] } } : {}),
  }
}
if (node.transport.grpc) {
  result['grpc-opts'] = { 'grpc-service-name': node.transport.grpc.serviceName }
}
```

VMess adds `uuid`、`alterId`、`cipher`; VLESS adds `uuid` and optional `flow`; Trojan adds `password`; SS adds `cipher` and `password`.

TLS adds `tls: true`, optional `servername`、`alpn`、`client-fingerprint`、`skip-cert-verify`. Reality additionally adds `reality-opts` with `public-key`, optional `short-id` and `spider-x`.

- [ ] **Step 4: Build the exact base config, groups, providers, and rules**

Use these immutable provider definitions:

```ts
const PROVIDERS = {
  private: ['domain', './ruleset/private.mrs', 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.mrs'],
  ads: ['domain', './ruleset/ads.mrs', 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ads-all.mrs'],
  'cn-domain': ['domain', './ruleset/cn-domain.mrs', 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.mrs'],
  'non-cn': ['domain', './ruleset/non-cn.mrs', 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/geolocation-!cn.mrs'],
  'cn-ip': ['ipcidr', './ruleset/cn-ip.mrs', 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.mrs'],
} as const
```

Each generated provider is `{ type: 'http', behavior, format: 'mrs', path, url, interval: 86400 }`. Omit `ads` only when `blockAds` is false.

Generate groups exactly:

```ts
const names = nodes.map(node => node.name)
const groups = [
  { name: '节点选择', type: 'select', proxies: ['自动选择', '故障转移', ...names, 'DIRECT'] },
  { name: '自动选择', type: 'url-test', proxies: names, url: 'https://www.gstatic.com/generate_204', interval: 300 },
  { name: '故障转移', type: 'fallback', proxies: names, url: 'https://www.gstatic.com/generate_204', interval: 300 },
]
```

Copy the fixed top-level and DNS values verbatim from the design spec. Build the six ordered rules using `DIRECT` or `节点选择` from `RuleOptions`.

- [ ] **Step 5: Serialize, parse again, and validate references**

`generateMihomoYaml()` must call `stringify(config, { lineWidth: 0 })`, parse the result, then call `validateMihomoConfig()`. Validation must assert:

- At least one proxy exists, proxy names are unique, and no proxy is named `DIRECT`、`REJECT`、`GLOBAL`、`节点选择`、`自动选择` or `故障转移`.
- Every proxy-group member is a proxy name, group name, or `DIRECT`.
- Every `RULE-SET` provider exists.
- Every rule target is a group name, `DIRECT`, or `REJECT`.
- `MATCH` is the last rule.

Throw `MihomoConfigError` with a field-level message and never include UUIDs or passwords.

- [ ] **Step 6: Run the config tests and full unit suite**

Run:

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit Mihomo generation**

```bash
git add docs/.vitepress/theme/v2ray-to-mihomo/mihomo-config.ts tests/v2ray-to-mihomo/mihomo-config.test.ts
git commit -m "feat: generate complete mihomo configs"
```

---

### Task 8: Browser Subscription Fetcher

**Files:**
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/fetch-subscription.ts`
- Create: `tests/v2ray-to-mihomo/fetch-subscription.test.ts`

**Interfaces:**
- Consumes: browser-compatible `fetch`, `AbortController`, `URL`.
- Produces: `FetchFailureKind`, `FetchSubscriptionError`, `FetchSubscriptionOptions`, `fetchSubscription(url: string, options?: FetchSubscriptionOptions): Promise<string>`.

- [ ] **Step 1: Write failing Fetch tests with injected page protocol and fetch implementation**

Create `tests/v2ray-to-mihomo/fetch-subscription.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import {
  FetchSubscriptionError,
  fetchSubscription,
} from '../../docs/.vitepress/theme/v2ray-to-mihomo/fetch-subscription'

describe('fetchSubscription', () => {
  it('rejects unsupported URL schemes and HTTPS-to-HTTP mixed content', async () => {
    await expect(fetchSubscription('file:///secret', { pageProtocol: 'https:' }))
      .rejects.toMatchObject({ kind: 'invalid-url' })
    await expect(fetchSubscription('http://sub.example/list', { pageProtocol: 'https:' }))
      .rejects.toMatchObject({ kind: 'mixed-content' })
  })

  it('fetches with omitted credentials and no referrer', async () => {
    const fetchImpl = vi.fn(async () => new Response('  payload  ', { status: 200 })) as typeof fetch
    await expect(fetchSubscription('https://sub.example/list', {
      pageProtocol: 'https:', fetchImpl,
    })).resolves.toBe('payload')
    expect(fetchImpl).toHaveBeenCalledWith('https://sub.example/list', expect.objectContaining({
      credentials: 'omit', referrerPolicy: 'no-referrer', signal: expect.any(AbortSignal),
    }))
  })

  it('classifies HTTP, empty, network, and timeout failures', async () => {
    const http = vi.fn(async () => new Response('bad', { status: 503 })) as typeof fetch
    const empty = vi.fn(async () => new Response('   ', { status: 200 })) as typeof fetch
    const network = vi.fn(async () => { throw new TypeError('Failed to fetch') }) as typeof fetch
    const hanging = vi.fn((_url, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })) as typeof fetch

    await expect(fetchSubscription('https://sub.example/list', { fetchImpl: http }))
      .rejects.toMatchObject({ kind: 'http', status: 503 })
    await expect(fetchSubscription('https://sub.example/list', { fetchImpl: empty }))
      .rejects.toMatchObject({ kind: 'empty' })
    await expect(fetchSubscription('https://sub.example/list', { fetchImpl: network }))
      .rejects.toMatchObject({ kind: 'network-or-cors' })
    await expect(fetchSubscription('https://sub.example/list', { fetchImpl: hanging, timeoutMs: 5 }))
      .rejects.toMatchObject({ kind: 'timeout' })
  })
})
```

- [ ] **Step 2: Run the Fetch tests and confirm they fail**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/fetch-subscription.test.ts
```

Expected: FAIL because `fetch-subscription.ts` does not exist.

- [ ] **Step 3: Implement URL checks and typed errors without module-level browser access**

Create `fetch-subscription.ts`:

```ts
export type FetchFailureKind =
  | 'invalid-url' | 'mixed-content' | 'timeout' | 'http' | 'network-or-cors' | 'empty'

export class FetchSubscriptionError extends Error {
  constructor(
    public readonly kind: FetchFailureKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'FetchSubscriptionError'
  }
}

export interface FetchSubscriptionOptions {
  pageProtocol?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}
```

Inside `fetchSubscription()`, parse and restrict the URL to HTTP(S), derive `pageProtocol` at call time with `typeof window === 'undefined' ? '' : window.location.protocol`, reject mixed content, and use `options.fetchImpl ?? globalThis.fetch`.

Create an `AbortController`, set a 15,000 ms default timer, and call:

```ts
fetchImpl(parsedUrl.href, {
  method: 'GET',
  credentials: 'omit',
  referrerPolicy: 'no-referrer',
  signal: controller.signal,
})
```

Clear the timer in `finally`. Non-2xx responses become `http`; blank bodies become `empty`; an aborted request becomes `timeout`; every other thrown Fetch error becomes `network-or-cors`. Error messages must not include the URL.

- [ ] **Step 4: Run Fetch and full tests**

Run:

```bash
npm test -- tests/v2ray-to-mihomo/fetch-subscription.test.ts
npm test
```

Expected: Fetch tests and full suite PASS.

- [ ] **Step 5: Commit the browser reader**

```bash
git add docs/.vitepress/theme/v2ray-to-mihomo/fetch-subscription.ts tests/v2ray-to-mihomo/fetch-subscription.test.ts
git commit -m "feat: fetch subscriptions with local fallback errors"
```

---

### Task 9: Functional Vue Tool and Published Page

**Files:**
- Create: `docs/.vitepress/theme/v2ray-to-mihomo/V2rayToMihomo.vue`
- Create: `docs/other/v2ray-to-clash.md`

**Interfaces:**
- Consumes: `fetchSubscription()`, `FetchSubscriptionError`, `FetchFailureKind`, `parseSubscription()`, `SubscriptionDecodeError`, `generateMihomoYaml()`, `MihomoConfigError`, `DEFAULT_RULE_OPTIONS`.
- Produces: a VitePress-safe Vue component and `/other/v2ray-to-clash` page.

- [ ] **Step 1: Create the page shell first and confirm the missing component breaks the build**

Create `docs/other/v2ray-to-clash.md`:

```md
---
title: V2Ray 订阅转 Clash Verge 配置
description: 在浏览器本地把 V2Ray 订阅转换成 Clash Verge Rev 可用的 Mihomo YAML 配置。
pageClass: v2ray-converter-page
outline: false
aside: false
---

<script setup>
import V2rayToMihomo from '../.vitepress/theme/v2ray-to-mihomo/V2rayToMihomo.vue'
</script>

# V2Ray 订阅转 Clash Verge 配置

转换过程在当前浏览器页面完成。支持 VMess、VLESS、Trojan 和 Shadowsocks，生成结果面向 Clash Verge Rev／Mihomo。

<V2rayToMihomo />
```

Run:

```bash
npm run docs:build
```

Expected: FAIL because `V2rayToMihomo.vue` does not exist.

- [ ] **Step 2: Implement component state and conversion functions**

Create `V2rayToMihomo.vue` using `<script setup lang="ts">`. Use only component-local refs/reactive state:

```ts
const subscriptionUrl = ref('')
const manualContent = ref('')
const manualOpen = ref(false)
const busy = ref(false)
const errorMessage = ref('')
const result = ref<ParseSubscriptionResult | null>(null)
const yaml = ref('')
const ruleOptions = reactive<RuleOptions>({ ...DEFAULT_RULE_OPTIONS })

function convert(content: string): void {
  errorMessage.value = ''
  try {
    const parsed = parseSubscription(content)
    result.value = parsed
    if (parsed.nodes.length === 0) {
      yaml.value = ''
      errorMessage.value = '没有找到可转换的 VMess、VLESS、Trojan 或 Shadowsocks 节点。'
      return
    }
    yaml.value = generateMihomoYaml(parsed.nodes, ruleOptions)
  } catch (error) {
    result.value = null
    yaml.value = ''
    errorMessage.value = error instanceof SubscriptionDecodeError || error instanceof MihomoConfigError
      ? error.message
      : '订阅内容无法转换，请检查内容格式。'
  }
}

watch(ruleOptions, () => {
  if (result.value?.nodes.length) {
    yaml.value = generateMihomoYaml(result.value.nodes, ruleOptions)
  }
}, { deep: true })
```

`readSubscription()` sets `busy`, calls `fetchSubscription(subscriptionUrl.value)`, then calls `convert()`. On `FetchSubscriptionError`, preserve the URL, set `manualOpen = true`, and use this exact message mapping:

```ts
const fetchMessages: Record<FetchFailureKind, string> = {
  'invalid-url': '请输入有效的 HTTP 或 HTTPS 订阅地址。',
  'mixed-content': 'HTTPS 页面无法读取 HTTP 订阅，请打开订阅地址后粘贴返回内容。',
  timeout: '读取订阅超时，请检查网络或改用手动粘贴。',
  http: '订阅服务返回错误状态，请确认地址有效或改用手动粘贴。',
  'network-or-cors': '浏览器无法读取订阅，可能是网络或 CORS 限制，请改用手动粘贴。',
  empty: '订阅服务返回了空内容，请确认地址是否有效。',
}
```

Unexpected errors use `读取订阅失败，请改用手动粘贴。`. Always clear `busy` in `finally`. Do not call `console.*`.

`convertManual()` calls `convert(manualContent.value)`. `reset()` blanks the URL, manual content, result, YAML and messages, closes the fallback, and restores all three defaults.

- [ ] **Step 3: Implement browser actions only inside event handlers**

Use these action shapes so module evaluation remains SSR-safe:

```ts
function openSubscription(): void {
  const popup = window.open(subscriptionUrl.value, '_blank', 'noopener,noreferrer')
  if (popup) popup.opener = null
}

async function copyConfig(): Promise<void> {
  try {
    await navigator.clipboard.writeText(yaml.value)
  } catch {
    errorMessage.value = '复制失败，请从预览中手动复制，或下载配置文件。'
  }
}

function downloadConfig(): void {
  try {
    const href = URL.createObjectURL(new Blob([yaml.value], { type: 'application/yaml;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = 'config.yaml'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(href), 0)
  } catch {
    errorMessage.value = '下载失败，请复制预览内容并保存为 config.yaml。'
  }
}
```

The open-subscription control must be a button, not an anchor containing the sensitive URL in `href`.

- [ ] **Step 4: Add the exact accessible template sections**

The template must contain:

- A `.converter-input` panel with a visible `<label for="subscription-url">`, URL input, `读取订阅` button, and local-processing note.
- A `无法读取？手动粘贴` toggle button.
- On Fetch failure, a `在新标签页打开订阅地址` button and expanded `<textarea id="manual-content">` with `转换粘贴内容`.
- A `.converter-rules` panel with checkboxes bound to `blockAds` and `directChina`, plus a labeled select bound to `unmatched` with values `proxy` and `direct`.
- A `.converter-result` panel that renders total/counts, warnings by line/protocol/message, a `<pre><code>{{ yaml }}</code></pre>`, and `复制配置`、`下载 config.yaml`、`清空` buttons.
- `aria-live="polite"` on status and error containers; `aria-busy` on the read action region.
- The warning `配置包含节点凭据，请勿截图或公开分享。`
- The disclosure `页面仍会加载本站现有的百度访问统计，但转换组件不会向统计脚本写入订阅或节点数据。`

Disable actions when their input is blank or while `busy` is true. Render warnings only from the already-sanitized `ParseWarning` objects.

- [ ] **Step 5: Add minimal scoped CSS so the unpolished page is usable**

Inside the component, add scoped rules for `.converter`, `.converter-grid`, `.converter-panel`, form controls, status/error blocks, action buttons, warning list, and YAML preview. Use VitePress variables only: `--vp-c-bg-soft`, `--vp-c-divider`, `--vp-c-text-1`, `--vp-c-text-2`, `--vp-c-brand-1`, `--vp-c-danger-1`. Do not introduce hard-coded light-only backgrounds.

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm test
npm run docs:build
```

Expected: all tests PASS and VitePress build completes.

- [ ] **Step 7: Commit the functional page**

```bash
git add docs/.vitepress/theme/v2ray-to-mihomo/V2rayToMihomo.vue docs/other/v2ray-to-clash.md
git commit -m "feat: add v2ray to mihomo converter page"
```

---

### Task 10: Responsive Polish, Navigation, and End-to-End Verification

**Files:**
- Modify: `docs/.vitepress/theme/v2ray-to-mihomo/V2rayToMihomo.vue`
- Modify: `docs/.vitepress/theme/style.css`
- Modify: `docs/other/index.md`

**Interfaces:**
- Consumes: the functional page from Task 9.
- Produces: a responsive, discoverable, verified published tool.

- [ ] **Step 1: Add the online-tool navigation entry**

In `docs/other/index.md`, insert before `### 零散工具`:

```md
### 在线工具

- [V2Ray 订阅转 Clash Verge 配置](./v2ray-to-clash.md)：在浏览器本地把 V2Ray 订阅转换为 Mihomo YAML。
```

- [ ] **Step 2: Give only this page a wider VitePress content area**

Append to `docs/.vitepress/theme/style.css`:

```css
@media (min-width: 960px) {
  .Layout.v2ray-converter-page .VPDoc .container {
    max-width: 1280px;
  }

  .Layout.v2ray-converter-page .VPDoc .content,
  .Layout.v2ray-converter-page .VPDoc .content-container,
  .Layout.v2ray-converter-page .vp-doc {
    max-width: none;
  }
}
```

- [ ] **Step 3: Finish component layout and interaction styling**

Use these exact layout constraints in the component scoped CSS:

```css
.converter { margin-top: 24px; }
.converter-grid { display: grid; gap: 16px; }
.converter-panel { border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 20px; background: var(--vp-c-bg-soft); }
.converter input, .converter textarea, .converter select { width: 100%; min-height: 42px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.converter textarea { min-height: 160px; resize: vertical; font-family: var(--vp-font-family-mono); }
.converter pre { max-height: 520px; overflow: auto; border-radius: 8px; }
.converter button:focus-visible, .converter input:focus-visible, .converter textarea:focus-visible, .converter select:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
@media (min-width: 900px) { .converter-grid { grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr); } .converter-input { grid-column: 1 / -1; } }
```

Keep touch targets at least 42 px high, keep status text selectable, and do not animate large layout changes. Verify contrast in both VitePress themes.

- [ ] **Step 4: Run the complete automated verification**

Run:

```bash
npm test
npm run docs:build
git diff --check
```

Expected: all tests PASS, the build completes, and `git diff --check` prints no errors.

- [ ] **Step 5: Start the site and a local CORS-enabled fictional subscription**

Terminal 1:

```bash
npm run docs:dev -- --host 127.0.0.1
```

Terminal 2:

```bash
node -e 'const http=require("node:http");const u="ss://"+Buffer.from("aes-128-gcm:test-pass").toString("base64url")+"@ss.example.com:8388#Local%20SS";const body=Buffer.from(u).toString("base64");http.createServer((_q,r)=>{r.setHeader("Access-Control-Allow-Origin","*");r.setHeader("Content-Type","text/plain;charset=utf-8");r.end(body)}).listen(8765,"127.0.0.1",()=>console.log("http://127.0.0.1:8765/subscription"))'
```

Open `/other/v2ray-to-clash`, enter `http://127.0.0.1:8765/subscription`, and verify one SS node, all three proxy groups, the default six rules, copy, and download.

Terminal 3 starts the same fictional subscription without a CORS response header:

```bash
node -e 'const http=require("node:http");const u="ss://"+Buffer.from("aes-128-gcm:test-pass").toString("base64url")+"@ss.example.com:8388#No%20CORS";http.createServer((_q,r)=>r.end(Buffer.from(u).toString("base64"))).listen(8766,"127.0.0.1",()=>console.log("http://127.0.0.1:8766/subscription"))'
```

- [ ] **Step 6: Verify fallback, privacy, responsiveness, and rule toggles in the browser**

Perform these exact checks:

1. Enter `http://127.0.0.1:8766/subscription` and verify the browser blocks the cross-origin response, the sanitized CORS/network message appears, and the paste field opens. The HTTPS-to-HTTP branch remains covered by `fetch-subscription.test.ts`.
2. Paste the fictional SS URI constructed in Terminal 2 directly and verify the same YAML is produced.
3. Add `ssr://secret-value` on a second line and verify only a sanitized unsupported-protocol warning appears.
4. Toggle advertising off and confirm the `ads` provider and rule disappear.
5. Toggle domestic direct off and confirm both Chinese rules target `节点选择`.
6. Set unmatched traffic to direct and confirm the last rule becomes `MATCH,DIRECT`.
7. Refresh and confirm the URL, pasted content, warnings and YAML are gone; verify the converter created no local/session storage keys.
8. In the Network panel, confirm the converter fetched only the entered subscription URL; MRS files are not downloaded by the page. Existing Baidu page-view traffic is expected.
9. Check keyboard focus, 375 px mobile layout, desktop two-column layout, light theme and dark theme.
10. Import the downloaded `config.yaml` into Clash Verge Rev and confirm Mihomo accepts it, the three groups are selectable, and rule providers can download.

- [ ] **Step 7: Verify all five MRS endpoints still respond**

Run:

```bash
printf '%s\n' \
'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.mrs' \
'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ads-all.mrs' \
'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.mrs' \
'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/geolocation-!cn.mrs' \
'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.mrs' | xargs -n1 -P5 curl -L --range 0-0 --max-time 25 -sS -o /dev/null -w '%{http_code} %{url_effective}\n'
```

Expected: five `206` or `200` responses.

- [ ] **Step 8: Commit navigation and visual polish**

```bash
git add docs/.vitepress/theme/v2ray-to-mihomo/V2rayToMihomo.vue docs/.vitepress/theme/style.css docs/other/index.md
git commit -m "docs: publish mihomo converter tool"
```

- [ ] **Step 9: Confirm the final worktree and commit sequence**

Run:

```bash
git status --short
git log --oneline -10
```

Expected: empty status and one focused commit for each completed task.
