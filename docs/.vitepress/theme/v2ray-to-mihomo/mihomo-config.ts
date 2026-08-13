import { parse, stringify } from 'yaml'
import {
  DEFAULT_RULE_OPTIONS,
  type ProxyNode,
  type RuleOptions,
} from './types'

/** Mihomo 配置树使用的通用对象结构。 */
type ConfigRecord = Record<string, unknown>

const GROUP_NAMES = ['节点选择', '自动选择', '故障转移'] as const
const RESERVED_PROXY_NAMES = new Set<string>([
  'DIRECT',
  'REJECT',
  'GLOBAL',
  ...GROUP_NAMES,
])

const PROVIDERS = {
  private: [
    'domain',
    './ruleset/private.mrs',
    'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.mrs',
  ],
  'private-ip': [
    'ipcidr',
    './ruleset/private-ip.mrs',
    'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/private.mrs',
  ],
  ads: [
    'domain',
    './ruleset/ads.mrs',
    'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ads-all.mrs',
  ],
  'google-domain': [
    'domain',
    './ruleset/google-domain.mrs',
    'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google.mrs',
  ],
  'google-ip': [
    'ipcidr',
    './ruleset/google-ip.mrs',
    'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/google.mrs',
  ],
  'cn-domain': [
    'domain',
    './ruleset/cn-domain.mrs',
    'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.mrs',
  ],
  'non-cn': [
    'domain',
    './ruleset/non-cn.mrs',
    'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/geolocation-!cn.mrs',
  ],
  'cn-ip': [
    'ipcidr',
    './ruleset/cn-ip.mrs',
    'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.mrs',
  ],
} as const

/** Mihomo 配置生成或校验失败时抛出的领域错误。 */
export class MihomoConfigError extends Error {
  /** 创建一条带可展示信息的配置错误。 */
  constructor(message: string) {
    super(message)
    this.name = 'MihomoConfigError'
  }
}

/** 根据代理节点和规则选项构建 Mihomo 配置对象。 */
export function buildMihomoConfig(
  nodes: ProxyNode[],
  options: RuleOptions = DEFAULT_RULE_OPTIONS,
): Record<string, unknown> {
  const names = nodes.map(node => node.name)
  const chinaTarget = options.directChina ? 'DIRECT' : '节点选择'
  const unmatchedTarget = options.unmatched === 'proxy' ? '节点选择' : 'DIRECT'
  const enabledProviders = getEnabledProviders(options)

  return {
    'mixed-port': 7890,
    'allow-lan': false,
    mode: 'rule',
    'log-level': 'info',
    ipv6: false,
    'unified-delay': true,
    'tcp-concurrent': true,
    profile: {
      'store-selected': true,
    },
    dns: {
      enable: true,
      ipv6: false,
      'respect-rules': true,
      'enhanced-mode': 'fake-ip',
      'fake-ip-range': '198.18.0.1/16',
      'default-nameserver': ['223.5.5.5', '119.29.29.29'],
      'nameserver-policy': {
        'rule-set:google-domain': [
          'https://dns.google/dns-query#节点选择',
          'https://cloudflare-dns.com/dns-query#节点选择',
        ],
      },
      nameserver: [
        'https://dns.alidns.com/dns-query',
        'https://doh.pub/dns-query',
      ],
      'proxy-server-nameserver': [
        'https://dns.alidns.com/dns-query',
        'https://doh.pub/dns-query',
      ],
    },
    proxies: nodes.map(toMihomoProxy),
    'proxy-groups': [
      {
        name: '节点选择',
        type: 'select',
        proxies: ['自动选择', '故障转移', ...names, 'DIRECT'],
      },
      {
        name: '自动选择',
        type: 'url-test',
        proxies: names,
        url: 'https://www.gstatic.com/generate_204',
        interval: 300,
      },
      {
        name: '故障转移',
        type: 'fallback',
        proxies: names,
        url: 'https://www.gstatic.com/generate_204',
        interval: 300,
      },
    ],
    'rule-providers': buildRuleProviders(enabledProviders),
    rules: [
      ...(enabledProviders.private ? ['RULE-SET,private,DIRECT'] : []),
      ...(enabledProviders['private-ip'] ? ['RULE-SET,private-ip,DIRECT,no-resolve'] : []),
      ...(enabledProviders.ads ? ['RULE-SET,ads,REJECT'] : []),
      ...(enabledProviders['google-domain'] ? ['RULE-SET,google-domain,节点选择'] : []),
      ...(enabledProviders['non-cn'] ? ['RULE-SET,non-cn,节点选择'] : []),
      ...(enabledProviders['google-ip'] ? ['RULE-SET,google-ip,节点选择,no-resolve'] : []),
      ...(enabledProviders['cn-domain'] ? [`RULE-SET,cn-domain,${chinaTarget}`] : []),
      ...(enabledProviders['cn-ip'] ? [`RULE-SET,cn-ip,${chinaTarget},no-resolve`] : []),
      `MATCH,${unmatchedTarget}`,
    ],
  }
}

/** 生成并回读校验完整的 Mihomo YAML。 */
export function generateMihomoYaml(
  nodes: ProxyNode[],
  options: RuleOptions = DEFAULT_RULE_OPTIONS,
): string {
  const config = buildMihomoConfig(nodes, options)
  let yaml: string
  let roundTripped: unknown

  try {
    yaml = stringify(config, { lineWidth: 0 })
    roundTripped = parse(yaml)
  } catch {
    throw new MihomoConfigError('yaml: 无法序列化或回读配置')
  }

  validateMihomoConfig(roundTripped)
  return yaml
}

/** 校验 Mihomo 配置中的节点、策略组和规则引用完整性。 */
export function validateMihomoConfig(config: unknown): void {
  if (!isRecord(config)) {
    fail('config', '配置必须是对象')
  }

  const proxies = config.proxies
  if (!Array.isArray(proxies) || proxies.length === 0) {
    fail('proxies', '至少需要一个有效节点')
  }

  const proxyNames = new Set<string>()
  proxies.forEach((proxy, index) => {
    if (!isRecord(proxy) || typeof proxy.name !== 'string' || proxy.name.length === 0) {
      fail(`proxies[${index}].name`, '节点名称必须是非空字符串')
    }
    if (RESERVED_PROXY_NAMES.has(proxy.name)) {
      fail(`proxies[${index}].name`, '节点名称与内置策略冲突')
    }
    if (proxyNames.has(proxy.name)) {
      fail(`proxies[${index}].name`, '节点名称必须唯一')
    }
    proxyNames.add(proxy.name)
  })

  const groups = config['proxy-groups']
  if (!Array.isArray(groups)) {
    fail('proxy-groups', '代理组必须是数组')
  }

  const groupNames = new Set<string>()
  groups.forEach((group, index) => {
    if (!isRecord(group) || typeof group.name !== 'string' || group.name.length === 0) {
      fail(`proxy-groups[${index}].name`, '代理组名称必须是非空字符串')
    }
    if (groupNames.has(group.name)) {
      fail(`proxy-groups[${index}].name`, '代理组名称必须唯一')
    }
    groupNames.add(group.name)
  })

  const groupMemberTargets = new Set<string>([...proxyNames, ...groupNames, 'DIRECT'])
  groups.forEach((group, groupIndex) => {
    if (!isRecord(group) || !Array.isArray(group.proxies)) {
      fail(`proxy-groups[${groupIndex}].proxies`, '代理组成员必须是数组')
    }
    group.proxies.forEach((member, memberIndex) => {
      if (typeof member !== 'string' || !groupMemberTargets.has(member)) {
        fail(
          `proxy-groups[${groupIndex}].proxies[${memberIndex}]`,
          '代理组引用不存在的节点或策略',
        )
      }
    })
  })

  const providers = config['rule-providers']
  if (!isRecord(providers)) {
    fail('rule-providers', '规则提供者必须是对象')
  }

  const rules = config.rules
  if (!Array.isArray(rules)) {
    fail('rules', '规则必须是数组')
  }

  const ruleTargets = new Set<string>([...groupNames, 'DIRECT', 'REJECT'])
  rules.forEach((rule, index) => {
    if (typeof rule !== 'string') {
      fail(`rules[${index}]`, '规则必须是字符串')
    }

    const parts = rule.split(',').map(part => part.trim())
    const ruleType = parts[0]
    if (ruleType === 'RULE-SET') {
      if (parts.length < 3) {
        fail(`rules[${index}]`, 'RULE-SET 规则格式无效')
      }
      if (!Object.hasOwn(providers, parts[1])) {
        fail(`rules[${index}]`, '规则引用不存在的规则提供者')
      }
      assertRuleTarget(parts[2], ruleTargets, index)
      return
    }

    if (ruleType === 'MATCH') {
      if (parts.length !== 2) {
        fail(`rules[${index}]`, 'MATCH 规则格式无效')
      }
      assertRuleTarget(parts[1], ruleTargets, index)
      if (index !== rules.length - 1) {
        fail(`rules[${index}]`, 'MATCH 必须是最后一条规则')
      }
      return
    }

    if (parts.length < 2) {
      fail(`rules[${index}]`, '规则格式无效')
    }
    const targetIndex = parts.at(-1) === 'no-resolve' ? parts.length - 2 : parts.length - 1
    assertRuleTarget(parts[targetIndex], ruleTargets, index)
  })

  const finalRule = rules.at(-1)
  if (typeof finalRule !== 'string' || finalRule.split(',')[0].trim() !== 'MATCH') {
    fail('rules', 'MATCH 必须是最后一条规则')
  }
}

/** 将统一代理节点转换为 Mihomo 单节点配置。 */
function toMihomoProxy(node: ProxyNode): ConfigRecord {
  const result: ConfigRecord = {
    name: node.name,
    type: node.type,
    server: node.server,
    port: node.port,
    udp: true,
  }

  switch (node.type) {
    case 'vmess':
      result.uuid = node.uuid
      result.alterId = node.alterId
      result.cipher = node.cipher
      break
    case 'vless':
      result.uuid = node.uuid
      if (node.flow !== undefined) result.flow = node.flow
      break
    case 'trojan':
      result.password = node.password
      break
    case 'ss':
      result.cipher = node.cipher
      result.password = node.password
      break
  }

  if (node.transport.network !== 'tcp') {
    result.network = node.transport.network
  }
  if (node.transport.ws) {
    result['ws-opts'] = {
      path: node.transport.ws.path,
      ...(node.transport.ws.host ? { headers: { Host: node.transport.ws.host } } : {}),
    }
  }
  if (node.transport.http) {
    result['http-opts'] = {
      method: 'GET',
      path: [node.transport.http.path],
      ...(node.transport.http.host
        ? { headers: { Host: [node.transport.http.host] } }
        : {}),
    }
  }
  if (node.transport.grpc) {
    result['grpc-opts'] = {
      'grpc-service-name': node.transport.grpc.serviceName,
    }
  }

  if (node.tls) {
    result.tls = true
    if (node.tls.serverName !== undefined) result.servername = node.tls.serverName
    if (node.tls.alpn !== undefined) result.alpn = node.tls.alpn
    if (node.tls.clientFingerprint !== undefined) {
      result['client-fingerprint'] = node.tls.clientFingerprint
    }
    if (node.tls.skipCertVerify !== undefined) {
      result['skip-cert-verify'] = node.tls.skipCertVerify
    }
    if (node.tls.security === 'reality' && node.tls.reality) {
      result['reality-opts'] = {
        'public-key': node.tls.reality.publicKey,
        ...(node.tls.reality.shortId !== undefined
          ? { 'short-id': node.tls.reality.shortId }
          : {}),
        ...(node.tls.reality.spiderX !== undefined
          ? { 'spider-x': node.tls.reality.spiderX }
          : {}),
      }
    }
  }

  return result
}

/** 将可选规则开关归一为每个规则提供者的启用状态。 */
function getEnabledProviders(options: RuleOptions): Record<keyof typeof PROVIDERS, boolean> {
  return {
    private: options.enablePrivateDomain ?? true,
    'private-ip': options.enablePrivateIp ?? true,
    ads: options.blockAds,
    'google-domain': true,
    'google-ip': true,
    'cn-domain': options.enableChinaDomain ?? true,
    'non-cn': options.enableNonChina ?? true,
    'cn-ip': options.enableChinaIp ?? true,
  }
}

/** 为已启用规则集构建 Mihomo 规则提供者配置。 */
function buildRuleProviders(enabledProviders: Record<keyof typeof PROVIDERS, boolean>): ConfigRecord {
  const providers: ConfigRecord = {}
  for (const [name, [behavior, path, url]] of Object.entries(PROVIDERS)) {
    if (!enabledProviders[name as keyof typeof PROVIDERS]) continue
    providers[name] = {
      type: 'http',
      behavior,
      format: 'mrs',
      path,
      url,
      interval: 86400,
    }
  }
  return providers
}

/** 校验规则引用的目标策略是否存在。 */
function assertRuleTarget(target: string, allowed: Set<string>, ruleIndex: number): void {
  if (!allowed.has(target)) {
    fail(`rules[${ruleIndex}]`, '规则引用不存在的策略')
  }
}

/** 判断未知值是否为可读取的普通配置对象。 */
function isRecord(value: unknown): value is ConfigRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 抛出带字段路径的 Mihomo 配置错误。 */
function fail(field: string, message: string): never {
  throw new MihomoConfigError(`${field}: ${message}`)
}
