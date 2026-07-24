import { decodeSubscriptionLines } from './codec'
import { NodeParseError } from './parsers/errors'
import { parseShadowsocksUri } from './parsers/shadowsocks'
import { parseTrojanUri } from './parsers/trojan'
import { parseVlessUri } from './parsers/vless'
import { parseVmessUri } from './parsers/vmess'
import type { ParseSubscriptionResult, ParseWarning, Protocol, ProxyNode } from './types'

const parsers = {
  vmess: parseVmessUri,
  vless: parseVlessUri,
  trojan: parseTrojanUri,
  ss: parseShadowsocksUri,
} satisfies Record<Protocol, (uri: string) => ProxyNode>

const RESERVED_NAMES = new Set([
  'DIRECT', 'REJECT', 'GLOBAL', '节点选择', '自动选择', '故障转移',
])

const SCHEME = /^([a-z][a-z0-9+.-]*):\/\//i

function allocateName(name: string, usedNames: Set<string>): string {
  if (!usedNames.has(name)) {
    usedNames.add(name)
    return name
  }

  let suffix = 2
  let candidate = `${name} #${suffix}`
  while (usedNames.has(candidate)) {
    suffix += 1
    candidate = `${name} #${suffix}`
  }
  usedNames.add(candidate)
  return candidate
}

function warning(line: number, protocol: string, code: string, message: string): ParseWarning {
  return { line, protocol, code, message }
}

export function parseSubscription(input: string): ParseSubscriptionResult {
  const result: ParseSubscriptionResult = {
    nodes: [],
    warnings: [],
    counts: { vmess: 0, vless: 0, trojan: 0, ss: 0 },
  }
  const usedNames = new Set(RESERVED_NAMES)

  for (const [index, uri] of decodeSubscriptionLines(input).entries()) {
    const line = index + 1
    const protocol = SCHEME.exec(uri)?.[1]?.toLowerCase() || 'unknown'
    if (!Object.hasOwn(parsers, protocol)) {
      result.warnings.push(warning(line, protocol, 'unsupported-protocol', `不支持的协议：${protocol}`))
      continue
    }

    try {
      const node = parsers[protocol as Protocol](uri)
      const originalName = node.name
      node.name = allocateName(originalName, usedNames)
      if (node.name !== originalName) {
        result.warnings.push(warning(line, protocol, 'renamed-node', `节点名称已调整为：${node.name}`))
      }
      result.nodes.push(node)
      result.counts[protocol as Protocol] += 1
    } catch (error) {
      if (error instanceof NodeParseError) {
        result.warnings.push(warning(line, protocol, error.code, error.message))
      } else {
        result.warnings.push(warning(line, protocol, 'parse-failed', '节点格式无效'))
      }
    }
  }

  return result
}
