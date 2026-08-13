/** 当前转换器支持的代理协议。 */
export type Protocol = 'vmess' | 'vless' | 'trojan' | 'ss'
/** 当前转换器支持的传输网络类型。 */
export type NetworkType = 'tcp' | 'ws' | 'http' | 'grpc'

/** TLS 或 Reality 连接参数。 */
export interface TlsOptions {
  /** 节点使用的安全协议。 */
  security: 'tls' | 'reality'
  /** TLS 握手使用的服务器名称。 */
  serverName?: string
  /** TLS ALPN 协议列表。 */
  alpn?: string[]
  /** TLS 客户端指纹标识。 */
  clientFingerprint?: string
  /** 是否跳过服务端证书校验。 */
  skipCertVerify?: boolean
  /** Reality 协议的专用握手参数。 */
  reality?: {
    /** Reality 服务端公钥。 */
    publicKey: string
    /** Reality 短标识。 */
    shortId?: string
    /** Reality SpiderX 路径。 */
    spiderX?: string
  }
}

/** 节点的底层传输配置。 */
export interface TransportOptions {
  /** 连接使用的网络传输类型。 */
  network: NetworkType
  /** WebSocket 传输参数。 */
  ws?: { path: string; host?: string }
  /** HTTP 传输参数。 */
  http?: { path: string; host?: string }
  /** gRPC 传输参数。 */
  grpc?: { serviceName: string }
}

/** 所有代理节点共用的连接字段。 */
interface BaseNode {
  /** 在生成配置中显示的唯一节点名称。 */
  name: string
  /** 代理服务器域名或 IP。 */
  server: string
  /** 代理服务器端口。 */
  port: number
  /** 节点的底层传输配置。 */
  transport: TransportOptions
  /** 可选的 TLS 或 Reality 配置。 */
  tls?: TlsOptions
}

/** 解析后的 VMess 节点。 */
export interface VmessNode extends BaseNode {
  /** 节点协议判别字段。 */
  type: 'vmess'
  /** VMess 用户 UUID。 */
  uuid: string
  /** VMess alterId。 */
  alterId: number
  /** VMess 加密方式。 */
  cipher: string
}

/** 解析后的 VLESS 节点。 */
export interface VlessNode extends BaseNode {
  /** 节点协议判别字段。 */
  type: 'vless'
  /** VLESS 用户 UUID。 */
  uuid: string
  /** VLESS 流控模式。 */
  flow?: string
}

/** 解析后的 Trojan 节点。 */
export interface TrojanNode extends BaseNode {
  /** 节点协议判别字段。 */
  type: 'trojan'
  /** Trojan 连接密码。 */
  password: string
}

/** 解析后的 Shadowsocks 节点。 */
export interface ShadowsocksNode extends BaseNode {
  /** 节点协议判别字段。 */
  type: 'ss'
  /** Shadowsocks 加密方式。 */
  cipher: string
  /** Shadowsocks 连接密码。 */
  password: string
}

/** 转换器支持的任一代理节点。 */
export type ProxyNode = VmessNode | VlessNode | TrojanNode | ShadowsocksNode

/** 单条订阅节点未能完整解析时的安全警告。 */
export interface ParseWarning {
  /** 警告对应的订阅内容行号，从 1 开始。 */
  line: number
  /** 从 URI 中识别出的协议名称。 */
  protocol: string
  /** 稳定的警告分类代码。 */
  code: string
  /** 可安全展示给用户的警告信息。 */
  message: string
}

/** 订阅解析完成后的节点、警告和协议统计。 */
export interface ParseSubscriptionResult {
  /** 成功解析且名称唯一的代理节点。 */
  nodes: ProxyNode[]
  /** 被跳过或自动修正的订阅行警告。 */
  warnings: ParseWarning[]
  /** 各支持协议的成功解析数量。 */
  counts: Record<Protocol, number>
}

/** 可在规则面板中调整顺序的规则项标识。 */
export type RuleId = 'private' | 'ads' | 'google' | 'non-cn' | 'cn'

/** 规则命中后使用的 Mihomo 出站策略。 */
export type RuleTarget = 'direct' | 'proxy' | 'reject'

/** 一条规则集的启用状态和出站策略。 */
export interface RuleItem {
  /** 规则集的稳定标识。 */
  id: RuleId
  /** 是否生成该规则集。 */
  enabled: boolean
  /** 命中规则后的出站策略。 */
  target: RuleTarget
}

/** Mihomo 规则集顺序、启用状态、出站策略和未匹配流量策略。 */
export interface RuleOptions {
  /** 按界面顺序排列的规则集。 */
  rules: RuleItem[]
  /** 未匹配流量最终使用代理还是直连。 */
  unmatched: 'proxy' | 'direct'
}

/** 新转换任务使用的默认规则选项。 */
export const DEFAULT_RULE_OPTIONS: RuleOptions = {
  rules: [
    {id: 'private', enabled: true, target: 'direct'},
    {id: 'ads', enabled: true, target: 'reject'},
    {id: 'google', enabled: true, target: 'proxy'},
    {id: 'non-cn', enabled: true, target: 'proxy'},
    {id: 'cn', enabled: true, target: 'direct'},
  ],
  unmatched: 'proxy',
}

/** 创建一份独立的默认规则选项，避免拖动时修改默认值。 */
export function createDefaultRuleOptions(): RuleOptions {
  return {
    rules: DEFAULT_RULE_OPTIONS.rules.map(rule => ({...rule})),
    unmatched: DEFAULT_RULE_OPTIONS.unmatched,
  }
}
