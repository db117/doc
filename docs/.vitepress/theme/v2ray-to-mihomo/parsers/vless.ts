import type { VlessNode } from '../types'
import { parseTls, parseTransport, parseUrlNode } from './url-options'

/** 解析 VLESS URI 为统一节点结构。 */
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
