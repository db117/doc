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

const SAFE_NODE_ERROR_MESSAGES: Record<string, string> = {
  'invalid-encoding': '节点包含无效编码',
  'invalid-url': '节点链接格式无效',
  'wrong-protocol': '节点协议与链接类型不匹配',
  'unsupported-transport': '不支持该节点的传输类型',
  'unsupported-security': '不支持该节点的安全类型',
  'invalid-port': '节点端口无效',
  'missing-field': '节点缺少必填字段',
  'invalid-ss-credential': 'Shadowsocks 凭据格式无效',
  'invalid-ss-uri': 'Shadowsocks 链接格式无效',
  'unsupported-ss-plugin': '不支持 Shadowsocks 插件',
  'invalid-vmess-json': 'VMess 内容格式无效',
}

/** 为重复或保留名称分配稳定且唯一的节点名称。 */
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

/** 创建一条结构化订阅解析警告。 */
function warning(line: number, protocol: string, code: string, message: string): ParseWarning {
  return { line, protocol, code, message }
}

/** 将内部节点解析错误映射为不泄露原始订阅内容的警告。 */
function safeNodeWarning(line: number, protocol: string, error: NodeParseError): ParseWarning {
  if (!Object.hasOwn(SAFE_NODE_ERROR_MESSAGES, error.code)) {
    return warning(line, protocol, 'parse-failed', '节点格式无效')
  }
  return warning(line, protocol, error.code, SAFE_NODE_ERROR_MESSAGES[error.code])
}

/** 解码并逐行解析订阅，同时保留可恢复的警告和协议统计。 */
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
      result.warnings.push(warning(line, protocol, 'unsupported-protocol', '暂不支持该协议'))
      continue
    }

    try {
      const node = parsers[protocol as Protocol](uri)
      const originalName = node.name
      node.name = allocateName(originalName, usedNames)
      if (node.name !== originalName) {
        result.warnings.push(warning(
          line,
          protocol,
          'renamed-node',
          '节点名称重复或与内置策略冲突，已自动调整',
        ))
      }
      result.nodes.push(node)
      result.counts[protocol as Protocol] += 1
    } catch (error) {
      if (error instanceof NodeParseError) {
        result.warnings.push(safeNodeWarning(line, protocol, error))
      } else {
        result.warnings.push(warning(line, protocol, 'parse-failed', '节点格式无效'))
      }
    }
  }

  return result
}
