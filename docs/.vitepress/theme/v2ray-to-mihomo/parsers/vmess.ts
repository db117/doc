import { decodeBase64Utf8 } from '../codec'
import type { NetworkType, TlsOptions, TransportOptions, VmessNode } from '../types'
import { NodeParseError, parsePort, requireText } from './errors'

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

function tlsOf(data: Record<string, unknown>): TlsOptions | undefined {
  if (data.tls !== 'tls') return undefined

  const alpn = typeof data.alpn === 'string'
    ? data.alpn.split(',').map(value => value.trim()).filter(Boolean)
    : undefined
  const allowInsecure = data.allowInsecure
  return {
    security: 'tls',
    ...(typeof data.sni === 'string' && data.sni ? { serverName: data.sni } : {}),
    ...(alpn?.length ? { alpn } : {}),
    ...(typeof data.fp === 'string' && data.fp ? { clientFingerprint: data.fp } : {}),
    ...(allowInsecure === true || allowInsecure === 1 || allowInsecure === 'true' || allowInsecure === '1'
      ? { skipCertVerify: true }
      : {}),
  }
}

export function parseVmessUri(uri: string): VmessNode {
  const encoded = uri.startsWith('vmess://') ? uri.slice('vmess://'.length) : uri
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(decodeBase64Utf8(encoded))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    data = parsed as Record<string, unknown>
  } catch {
    throw new NodeParseError('invalid-vmess-json', 'VMess 内容不是有效的 JSON')
  }

  const node: VmessNode = {
    type: 'vmess',
    name: typeof data.ps === 'string' && data.ps.trim() ? data.ps.trim() : '未命名节点',
    server: requireText(data.add, 'add'),
    port: parsePort(data.port),
    uuid: requireText(data.id, 'id'),
    alterId: data.aid === undefined ? 0 : Number(data.aid),
    cipher: typeof data.scy === 'string' && data.scy ? data.scy : 'auto',
    transport: transportOf(data),
  }
  const tls = tlsOf(data)
  if (tls) node.tls = tls
  return node
}
