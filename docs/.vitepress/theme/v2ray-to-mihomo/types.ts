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
