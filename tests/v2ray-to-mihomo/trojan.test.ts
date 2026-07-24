import { describe, expect, it } from 'vitest'
import { parseTrojanUri } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/trojan'

describe('parseTrojanUri', () => {
  it('parses password, WebSocket, TLS, ALPN, and fingerprint', () => {
    const uri = 'trojan://secret%3Apass@trojan.example.com:443' +
      '?security=tls&type=ws&host=cdn.example.com&path=%2Ftrojan' +
      '&sni=cdn.example.com&alpn=h2%2Chttp%2F1.1&fp=chrome#Trojan%20US'
    expect(parseTrojanUri(uri)).toEqual({
      type: 'trojan', name: 'Trojan US', server: 'trojan.example.com', port: 443,
      password: 'secret:pass',
      transport: { network: 'ws', ws: { path: '/trojan', host: 'cdn.example.com' } },
      tls: {
        security: 'tls', serverName: 'cdn.example.com',
        alpn: ['h2', 'http/1.1'], clientFingerprint: 'chrome',
      },
    })
  })

  it('rejects a missing password', () => {
    expect(() => parseTrojanUri('trojan://@host.example:443#bad')).toThrow('缺少必填字段：密码')
  })

  it('defaults to TCP with TLS when options are absent', () => {
    expect(parseTrojanUri('trojan://secret@host.example:443#Default')).toMatchObject({
      transport: { network: 'tcp' }, tls: { security: 'tls' },
    })
  })
})
