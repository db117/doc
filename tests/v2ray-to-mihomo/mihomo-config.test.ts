import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import {
  buildMihomoConfig,
  generateMihomoYaml,
  MihomoConfigError,
  validateMihomoConfig,
} from '../../docs/.vitepress/theme/v2ray-to-mihomo/mihomo-config'
import type { ProxyNode, RuleOptions } from '../../docs/.vitepress/theme/v2ray-to-mihomo/types'

const secretUuid = '11111111-1111-4111-8111-111111111111'
const secretPassword = 'test-pass-do-not-leak'

const nodes: ProxyNode[] = [
  {
    type: 'vless', name: 'Reality', server: 'edge.example.com', port: 443,
    uuid: secretUuid, flow: 'xtls-rprx-vision', transport: { network: 'tcp' },
    tls: {
      security: 'reality', serverName: 'www.cloudflare.com', alpn: ['h2', 'http/1.1'],
      clientFingerprint: 'chrome', skipCertVerify: true,
      reality: { publicKey: 'public-key', shortId: 'abcd', spiderX: '/' },
    },
  },
  {
    type: 'ss', name: 'SS', server: 'ss.example.com', port: 8388,
    cipher: 'aes-128-gcm', password: secretPassword, transport: { network: 'tcp' },
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
  {
    type: 'vless', name: 'VLESS HTTP', server: 'http.example.com', port: 8443,
    uuid: '33333333-3333-4333-8333-333333333333',
    transport: { network: 'http', http: { path: '/h2', host: 'host.example.com' } },
  },
]

const standardOptions: RuleOptions = {
  enablePrivateDomain: true,
  enablePrivateIp: true,
  blockAds: true,
  enableChinaDomain: true,
  enableChinaIp: true,
  enableNonChina: true,
  directChina: true,
  unmatched: 'proxy',
}

describe('generateMihomoYaml', () => {
  it('round-trips the exact fixed base settings, DNS, groups, and MRS providers', () => {
    const config = parse(generateMihomoYaml(nodes, standardOptions))

    expect({
      'mixed-port': config['mixed-port'],
      'allow-lan': config['allow-lan'],
      mode: config.mode,
      'log-level': config['log-level'],
      ipv6: config.ipv6,
      'unified-delay': config['unified-delay'],
      'tcp-concurrent': config['tcp-concurrent'],
      profile: config.profile,
    }).toEqual({
      'mixed-port': 7890,
      'allow-lan': false,
      mode: 'rule',
      'log-level': 'info',
      ipv6: false,
      'unified-delay': true,
      'tcp-concurrent': true,
      profile: { 'store-selected': true },
    })
    expect(config.dns).toEqual({
      enable: true,
      ipv6: false,
      'enhanced-mode': 'fake-ip',
      'fake-ip-range': '198.18.0.1/16',
      'default-nameserver': ['223.5.5.5', '119.29.29.29'],
      nameserver: ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'],
      'proxy-server-nameserver': [
        'https://dns.alidns.com/dns-query',
        'https://doh.pub/dns-query',
      ],
    })
    expect(config['proxy-groups']).toEqual([
      {
        name: '节点选择', type: 'select',
        proxies: ['自动选择', '故障转移', 'Reality', 'SS', 'VMess WS', 'Trojan gRPC', 'VLESS HTTP', 'DIRECT'],
      },
      {
        name: '自动选择', type: 'url-test',
        proxies: ['Reality', 'SS', 'VMess WS', 'Trojan gRPC', 'VLESS HTTP'],
        url: 'https://www.gstatic.com/generate_204', interval: 300,
      },
      {
        name: '故障转移', type: 'fallback',
        proxies: ['Reality', 'SS', 'VMess WS', 'Trojan gRPC', 'VLESS HTTP'],
        url: 'https://www.gstatic.com/generate_204', interval: 300,
      },
    ])
    expect(config['rule-providers']).toEqual({
      private: {
        type: 'http', behavior: 'domain', format: 'mrs', path: './ruleset/private.mrs',
        url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.mrs',
        interval: 86400,
      },
      'private-ip': {
        type: 'http', behavior: 'ipcidr', format: 'mrs', path: './ruleset/private-ip.mrs',
        url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/private.mrs',
        interval: 86400,
      },
      ads: {
        type: 'http', behavior: 'domain', format: 'mrs', path: './ruleset/ads.mrs',
        url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ads-all.mrs',
        interval: 86400,
      },
      'cn-domain': {
        type: 'http', behavior: 'domain', format: 'mrs', path: './ruleset/cn-domain.mrs',
        url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.mrs',
        interval: 86400,
      },
      'non-cn': {
        type: 'http', behavior: 'domain', format: 'mrs', path: './ruleset/non-cn.mrs',
        url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/geolocation-!cn.mrs',
        interval: 86400,
      },
      'cn-ip': {
        type: 'http', behavior: 'ipcidr', format: 'mrs', path: './ruleset/cn-ip.mrs',
        url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.mrs',
        interval: 86400,
      },
    })
  })

  it('maps all protocol identities, transports, TLS, and Reality options', () => {
    const config = parse(generateMihomoYaml(nodes, standardOptions))

    expect(config.proxies).toEqual([
      {
        name: 'Reality', type: 'vless', server: 'edge.example.com', port: 443, udp: true,
        uuid: secretUuid, flow: 'xtls-rprx-vision', tls: true,
        servername: 'www.cloudflare.com', alpn: ['h2', 'http/1.1'],
        'client-fingerprint': 'chrome', 'skip-cert-verify': true,
        'reality-opts': { 'public-key': 'public-key', 'short-id': 'abcd', 'spider-x': '/' },
      },
      {
        name: 'SS', type: 'ss', server: 'ss.example.com', port: 8388, udp: true,
        cipher: 'aes-128-gcm', password: secretPassword,
      },
      {
        name: 'VMess WS', type: 'vmess', server: 'vmess.example.com', port: 443, udp: true,
        uuid: '22222222-2222-4222-8222-222222222222', alterId: 0, cipher: 'auto',
        network: 'ws', 'ws-opts': { path: '/socket', headers: { Host: 'cdn.example.com' } },
        tls: true, servername: 'cdn.example.com',
      },
      {
        name: 'Trojan gRPC', type: 'trojan', server: 'trojan.example.com', port: 443, udp: true,
        password: 'trojan-pass', network: 'grpc',
        'grpc-opts': { 'grpc-service-name': 'tunnel' },
        tls: true, servername: 'trojan.example.com',
      },
      {
        name: 'VLESS HTTP', type: 'vless', server: 'http.example.com', port: 8443, udp: true,
        uuid: '33333333-3333-4333-8333-333333333333', network: 'http',
        'http-opts': { method: 'GET', path: ['/h2'], headers: { Host: ['host.example.com'] } },
      },
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

  it.each(combinations)('builds the exact ordered rules for %o', options => {
    const config = parse(generateMihomoYaml(nodes, options))
    const chinaTarget = options.directChina ? 'DIRECT' : '节点选择'
    const unmatchedTarget = options.unmatched === 'proxy' ? '节点选择' : 'DIRECT'
    const expectedRules = [
      'RULE-SET,private,DIRECT',
      'RULE-SET,private-ip,DIRECT,no-resolve',
      ...(options.blockAds ? ['RULE-SET,ads,REJECT'] : []),
      `RULE-SET,cn-domain,${chinaTarget}`,
      'RULE-SET,non-cn,节点选择',
      `RULE-SET,cn-ip,${chinaTarget},no-resolve`,
      `MATCH,${unmatchedTarget}`,
    ]

    expect(config.rules).toEqual(expectedRules)
    expect(Object.keys(config['rule-providers'])).toEqual(
      options.blockAds
        ? ['private', 'private-ip', 'ads', 'cn-domain', 'non-cn', 'cn-ip']
        : ['private', 'private-ip', 'cn-domain', 'non-cn', 'cn-ip'],
    )
  })

  it('uses the standard rule options when options are omitted', () => {
    expect(parse(generateMihomoYaml(nodes)).rules).toEqual([
      'RULE-SET,private,DIRECT',
      'RULE-SET,private-ip,DIRECT,no-resolve',
      'RULE-SET,ads,REJECT',
      'RULE-SET,cn-domain,DIRECT',
      'RULE-SET,non-cn,节点选择',
      'RULE-SET,cn-ip,DIRECT,no-resolve',
      'MATCH,节点选择',
    ])
  })

  it('omits disabled rule providers and their associated rules', () => {
    const config = parse(generateMihomoYaml(nodes, {
      ...standardOptions,
      enablePrivateDomain: false,
      enablePrivateIp: false,
      blockAds: false,
      enableChinaDomain: false,
      enableChinaIp: false,
      enableNonChina: false,
    }))

    expect(config['rule-providers']).toEqual({})
    expect(config.rules).toEqual(['MATCH,节点选择'])
  })

  it('returns an object through buildMihomoConfig without serializing it', () => {
    const config = buildMihomoConfig(nodes, standardOptions)
    expect(config.proxies).toHaveLength(5)
    expect(config.rules).toEqual([
      'RULE-SET,private,DIRECT',
      'RULE-SET,private-ip,DIRECT,no-resolve',
      'RULE-SET,ads,REJECT',
      'RULE-SET,cn-domain,DIRECT',
      'RULE-SET,non-cn,节点选择',
      'RULE-SET,cn-ip,DIRECT,no-resolve',
      'MATCH,节点选择',
    ])
  })
})

describe('validateMihomoConfig', () => {
  const validConfig = () => ({
    proxies: [{ name: 'Node', uuid: secretUuid, password: secretPassword }],
    'proxy-groups': [{ name: '节点选择', proxies: ['Node', 'DIRECT'] }],
    'rule-providers': { private: {} },
    rules: ['RULE-SET,private,DIRECT', 'MATCH,节点选择'],
  })

  it('rejects empty proxy arrays', () => {
    expect(() => validateMihomoConfig({ ...validConfig(), proxies: [] }))
      .toThrow('至少需要一个有效节点')
  })

  it.each(['DIRECT', 'REJECT', 'GLOBAL', '节点选择', '自动选择', '故障转移'])
  ('rejects the reserved proxy name %s', name => {
    expect(() => validateMihomoConfig({ ...validConfig(), proxies: [{ name }] }))
      .toThrow('节点名称与内置策略冲突')
  })

  it('rejects duplicate proxy names without exposing credentials', () => {
    const config = validConfig()
    config.proxies.push({ name: 'Node', uuid: 'another-uuid', password: 'another-password' })
    expectSecretSafeFailure(config, '节点名称必须唯一')
  })

  it('rejects dangling proxy-group references without exposing credentials', () => {
    const config = validConfig()
    config['proxy-groups'][0].proxies = ['Missing']
    expectSecretSafeFailure(config, '代理组引用不存在的节点或策略')
  })

  it('rejects dangling RULE-SET provider references', () => {
    const config = validConfig()
    config.rules = ['RULE-SET,missing,DIRECT', 'MATCH,节点选择']
    expectSecretSafeFailure(config, '规则引用不存在的规则提供者')
  })

  it('rejects dangling rule targets', () => {
    const config = validConfig()
    config.rules = ['RULE-SET,private,Missing', 'MATCH,节点选择']
    expectSecretSafeFailure(config, '规则引用不存在的策略')
  })

  it('requires MATCH to be the final rule', () => {
    const config = validConfig()
    config.rules = ['MATCH,节点选择', 'RULE-SET,private,DIRECT']
    expectSecretSafeFailure(config, 'MATCH 必须是最后一条规则')
  })

  it('uses MihomoConfigError with field-level messages for malformed input', () => {
    expect(() => validateMihomoConfig(null)).toThrow(MihomoConfigError)
    expect(() => validateMihomoConfig(null)).toThrow('config: 配置必须是对象')
  })
})

function expectSecretSafeFailure(config: unknown, expectedMessage: string): void {
  let caught: unknown
  try {
    validateMihomoConfig(config)
  } catch (error) {
    caught = error
  }

  expect(caught).toBeInstanceOf(MihomoConfigError)
  expect(String(caught)).toContain(expectedMessage)
  expect(String(caught)).not.toContain(secretUuid)
  expect(String(caught)).not.toContain(secretPassword)
  expect(String(caught)).not.toContain('another-uuid')
  expect(String(caught)).not.toContain('another-password')
}
