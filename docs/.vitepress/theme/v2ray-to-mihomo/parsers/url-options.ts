import type { NetworkType, TlsOptions, TransportOptions } from '../types'
import { NodeParseError, parsePort, requireText } from './errors'

export interface ParsedUrlNode {
  identity: string
  server: string
  port: number
  name: string
  params: URLSearchParams
}

function decodePart(value: string, field: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    throw new NodeParseError('invalid-encoding', `${field} 包含无效的 URL 编码`)
  }
}

export function parseUrlNode(uri: string, protocol: 'vless' | 'trojan'): ParsedUrlNode {
  let url: URL
  try {
    url = new URL(uri)
  } catch {
    throw new NodeParseError('invalid-url', `${protocol.toUpperCase()} 链接格式无效`)
  }
  if (url.protocol !== `${protocol}:`) {
    throw new NodeParseError('wrong-protocol', `节点不是 ${protocol.toUpperCase()} 协议`)
  }
  const identityField = protocol === 'vless' ? 'UUID' : '密码'
  return {
    identity: requireText(decodePart(url.username, identityField), identityField),
    server: requireText(url.hostname.replace(/^\[|\]$/g, ''), '服务器'),
    port: parsePort(url.port),
    name: decodePart(url.hash.slice(1), '节点名称') || '未命名节点',
    params: url.searchParams,
  }
}

export function parseTransport(params: URLSearchParams): TransportOptions {
  const network = params.get('type') || 'tcp'
  if (!['tcp', 'ws', 'http', 'grpc'].includes(network)) {
    throw new NodeParseError('unsupported-transport', `不支持的传输类型：${network}`)
  }
  const path = params.get('path') || '/'
  const host = params.get('host') || undefined
  if (network === 'ws') return { network, ws: { path, host } }
  if (network === 'http') return { network, http: { path, host } }
  if (network === 'grpc') return { network, grpc: { serviceName: params.get('serviceName') || '' } }
  return { network: network as NetworkType }
}

export function parseTls(params: URLSearchParams): TlsOptions | undefined {
  const security = params.get('security')
  if (!security || security === 'none') return undefined
  if (security !== 'tls' && security !== 'reality') {
    throw new NodeParseError('unsupported-security', `不支持的安全类型：${security}`)
  }

  const alpn = params.get('alpn')?.split(',').map(value => value.trim()).filter(Boolean)
  const allowInsecure = params.get('allowInsecure')?.toLowerCase()
  const tls: TlsOptions = {
    security,
    ...(params.get('sni') ? { serverName: params.get('sni')! } : {}),
    ...(alpn?.length ? { alpn } : {}),
    ...(params.get('fp') ? { clientFingerprint: params.get('fp')! } : {}),
    ...(allowInsecure === 'true' || allowInsecure === '1' ? { skipCertVerify: true } : {}),
  }
  if (security === 'reality') {
    tls.reality = {
      publicKey: requireText(params.get('pbk'), 'Reality 公钥'),
      ...(params.get('sid') ? { shortId: params.get('sid')! } : {}),
      ...(params.get('spx') ? { spiderX: params.get('spx')! } : {}),
    }
  }
  return tls
}
