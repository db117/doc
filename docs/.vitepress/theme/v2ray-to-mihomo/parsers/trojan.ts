import type { TrojanNode } from '../types'
import { parseTls, parseTransport, parseUrlNode } from './url-options'

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
