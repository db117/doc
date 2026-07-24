import { describe, expect, it } from 'vitest'
import { NodeParseError } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/errors'
import { parseTls, parseTransport, parseUrlNode } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/url-options'
import { parseVlessUri } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/vless'

describe('parseVlessUri', () => {
  it('parses TCP Reality options', () => {
    const uri = 'vless://11111111-1111-4111-8111-111111111111@edge.example.com:443' +
      '?encryption=none&security=reality&type=tcp' +
      '&sni=www.cloudflare.com&fp=chrome&pbk=public-key&sid=abcd&spx=%2F' +
      '&flow=xtls-rprx-vision#Reality%20HK'
    expect(parseVlessUri(uri)).toEqual({
      type: 'vless', name: 'Reality HK', server: 'edge.example.com', port: 443,
      uuid: '11111111-1111-4111-8111-111111111111', flow: 'xtls-rprx-vision',
      transport: { network: 'tcp' },
      tls: {
        security: 'reality', serverName: 'www.cloudflare.com', clientFingerprint: 'chrome',
        reality: { publicKey: 'public-key', shortId: 'abcd', spiderX: '/' },
      },
    })
  })

  it('parses WebSocket host and path', () => {
    const uri = 'vless://11111111-1111-4111-8111-111111111111@ws.example.com:443' +
      '?security=tls&type=ws&host=cdn.example.com&path=%2Fws&sni=cdn.example.com#WS'
    expect(parseVlessUri(uri)).toMatchObject({
      name: 'WS', transport: { network: 'ws', ws: { path: '/ws', host: 'cdn.example.com' } },
      tls: { security: 'tls', serverName: 'cdn.example.com' },
    })
  })

  it('defaults to plain TCP when transport and security are absent', () => {
    const uri = 'vless://11111111-1111-4111-8111-111111111111@plain.example.com:80#Plain'
    expect(parseVlessUri(uri)).toMatchObject({
      name: 'Plain', transport: { network: 'tcp' }, tls: undefined,
    })
  })

  it('strips IPv6 brackets from the server', () => {
    const uri = 'vless://11111111-1111-4111-8111-111111111111@[2001:db8::1]:443#IPv6'
    expect(parseVlessUri(uri)).toMatchObject({ server: '2001:db8::1', port: 443 })
  })

  it.each(['', ':0', ':65536'])('rejects an invalid port suffix %j', suffix => {
    const uri = `vless://11111111-1111-4111-8111-111111111111@edge.example.com${suffix}`
    expect(() => parseVlessUri(uri)).toThrow(NodeParseError)
  })

  it('decodes an encoded WebSocket path exactly once', () => {
    const uri = 'vless://11111111-1111-4111-8111-111111111111@edge.example.com:443?type=ws&path=%252F'
    expect(parseVlessUri(uri).transport).toEqual({ network: 'ws', ws: { path: '%2F', host: undefined } })
  })

  it.each([
    'vless://bad%ZZ@edge.example.com:443',
    'vless://11111111-1111-4111-8111-111111111111@edge.example.com:443#bad%ZZ',
  ])('rejects malformed percent encoding without exposing sensitive URI values', uri => {
    let caught: unknown
    try {
      parseVlessUri(uri)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(NodeParseError)
    expect(String(caught)).not.toContain(uri)
    expect(String(caught)).not.toContain('11111111-1111-4111-8111-111111111111')
    expect(String(caught)).not.toContain('bad%ZZ')
  })

  it('keeps sensitive identity-like values out of bad URI errors', () => {
    const uri = 'vless://11111111-1111-4111-8111-111111111111%3Apassword@example.com:0'
    try {
      parseVlessUri(uri)
      throw new Error('expected VLESS parsing to fail')
    } catch (error) {
      expect(String(error)).toContain('端口必须在 1 到 65535 之间')
      expect(String(error)).not.toContain(uri)
      expect(String(error)).not.toContain('password')
      expect(String(error)).not.toContain('11111111-1111-4111-8111-111111111111')
    }
  })
})

describe('shared URL options', () => {
  it('maps HTTP and gRPC transport options', () => {
    expect(parseTransport(new URLSearchParams('type=http&path=%2Fh2&host=h2.example.com')))
      .toEqual({ network: 'http', http: { path: '/h2', host: 'h2.example.com' } })
    expect(parseTransport(new URLSearchParams('type=grpc&serviceName=tunnel')))
      .toEqual({ network: 'grpc', grpc: { serviceName: 'tunnel' } })
  })

  it('maps TLS parameters and only enables insecure verification for true or 1', () => {
    expect(parseTls(new URLSearchParams('security=tls&sni=edge.example.com&alpn=h2%2Chttp%2F1.1&fp=chrome&allowInsecure=TRUE')))
      .toEqual({
        security: 'tls', serverName: 'edge.example.com', alpn: ['h2', 'http/1.1'],
        clientFingerprint: 'chrome', skipCertVerify: true,
      })
    expect(parseTls(new URLSearchParams('security=tls&allowInsecure=0')))
      .toEqual({ security: 'tls' })
  })

  it('rejects unsupported URL options without exposing the URI', () => {
    expect(() => parseTransport(new URLSearchParams('type=quic')))
      .toThrow(new NodeParseError('unsupported-transport', '不支持的传输类型：quic'))
    expect(() => parseTls(new URLSearchParams('security=reality')))
      .toThrow(new NodeParseError('missing-field', '缺少必填字段：Reality 公钥'))
    expect(() => parseTls(new URLSearchParams('security=xtls')))
      .toThrow(new NodeParseError('unsupported-security', '不支持的安全类型：xtls'))
  })

  it('validates protocol and required URL identity fields', () => {
    expect(() => parseUrlNode('trojan://password@example.com:443', 'vless'))
      .toThrow(new NodeParseError('wrong-protocol', '节点不是 VLESS 协议'))
    expect(() => parseUrlNode('vless://@example.com:443', 'vless'))
      .toThrow(new NodeParseError('missing-field', '缺少必填字段：UUID'))
  })
})
