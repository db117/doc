import { describe, expect, it } from 'vitest'
import { parseVmessUri } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/vmess'

function vmessUri(payload: Record<string, unknown>): string {
  return `vmess://${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')}`
}

describe('parseVmessUri', () => {
  it('parses WebSocket TLS fields and a Unicode name', () => {
    const node = parseVmessUri(vmessUri({
      v: '2', ps: '香港 🚀', add: 'edge.example.com', port: '443',
      id: '11111111-1111-4111-8111-111111111111', aid: '0', scy: 'auto',
      net: 'ws', host: 'cdn.example.com', path: '/socket', tls: 'tls',
      sni: 'cdn.example.com', alpn: 'h2,http/1.1', fp: 'chrome',
    }))

    expect(node).toMatchObject({
      type: 'vmess', name: '香港 🚀', server: 'edge.example.com', port: 443,
      uuid: '11111111-1111-4111-8111-111111111111', alterId: 0, cipher: 'auto',
      transport: { network: 'ws', ws: { path: '/socket', host: 'cdn.example.com' } },
      tls: {
        security: 'tls', serverName: 'cdn.example.com',
        alpn: ['h2', 'http/1.1'], clientFingerprint: 'chrome',
      },
    })
  })

  it('rejects missing identity and out-of-range ports without echoing the URI', () => {
    const uri = vmessUri({ ps: 'bad', add: 'host.example', port: '70000', id: '' })
    expect(() => parseVmessUri(uri)).toThrow('端口必须在 1 到 65535 之间')
  })

  it('maps TCP, HTTP, and gRPC transports', () => {
    const base = {
      ps: 'transport', add: 'edge.example.com', port: '443',
      id: '11111111-1111-4111-8111-111111111111', aid: '0',
    }
    expect(parseVmessUri(vmessUri({ ...base, net: 'tcp' })).transport)
      .toEqual({ network: 'tcp' })
    expect(parseVmessUri(vmessUri({ ...base, net: 'http', path: '/h2', host: 'h2.example.com' })).transport)
      .toEqual({ network: 'http', http: { path: '/h2', host: 'h2.example.com' } })
    expect(parseVmessUri(vmessUri({ ...base, net: 'grpc', path: 'tunnel' })).transport)
      .toEqual({ network: 'grpc', grpc: { serviceName: 'tunnel' } })
  })

  it('rejects a boolean port without echoing the URI', () => {
    const uri = vmessUri({
      add: 'edge.example.com', port: true, id: '11111111-1111-4111-8111-111111111111',
    })

    try {
      parseVmessUri(uri)
      throw new Error('expected VMess parsing to fail')
    } catch (error) {
      expect(error).toHaveProperty('message', '端口必须在 1 到 65535 之间')
      expect(String(error)).not.toContain(uri)
    }
  })

  it('uses VMess defaults when optional values are omitted', () => {
    const node = parseVmessUri(vmessUri({
      add: 'edge.example.com', port: '443', id: '11111111-1111-4111-8111-111111111111',
    }))

    expect(node).toMatchObject({
      name: '未命名节点', alterId: 0, cipher: 'auto', transport: { network: 'tcp' },
    })
  })

  it('rejects invalid Base64 or JSON VMess content', () => {
    expect(() => parseVmessUri('vmess://not-base64!')).toThrow('VMess 内容不是有效的 JSON')
    expect(() => parseVmessUri(`vmess://${Buffer.from('not JSON', 'utf8').toString('base64')}`))
      .toThrow('VMess 内容不是有效的 JSON')
  })

  it('rejects an unknown transport', () => {
    expect(() => parseVmessUri(vmessUri({
      add: 'edge.example.com', port: '443', id: '11111111-1111-4111-8111-111111111111', net: 'quic',
    }))).toThrow('不支持的传输类型：quic')
  })

  it.each([true, 1, 'true', '1'])('maps allowInsecure=%j to skipCertVerify', allowInsecure => {
    const node = parseVmessUri(vmessUri({
      add: 'edge.example.com', port: '443', id: '11111111-1111-4111-8111-111111111111',
      tls: 'tls', allowInsecure,
    }))

    expect(node.tls).toMatchObject({ security: 'tls', skipCertVerify: true })
  })
})
