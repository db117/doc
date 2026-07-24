import { describe, expect, it } from 'vitest'
import { parseShadowsocksUri } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/shadowsocks'

describe('parseShadowsocksUri', () => {
  it('parses a fully Base64-encoded authority', () => {
    const authority = Buffer.from('aes-128-gcm:test-pass@ss.example.com:8388').toString('base64')
    expect(parseShadowsocksUri(`ss://${authority}#SS%20One`)).toEqual({
      type: 'ss', name: 'SS One', server: 'ss.example.com', port: 8388,
      cipher: 'aes-128-gcm', password: 'test-pass', transport: { network: 'tcp' },
    })
  })

  it('parses Base64 userinfo with an IPv6 host', () => {
    const userinfo = Buffer.from('chacha20-ietf-poly1305:p%40ss').toString('base64url')
    expect(parseShadowsocksUri(`ss://${userinfo}@[2001:db8::1]:443#IPv6`)).toMatchObject({
      server: '2001:db8::1', port: 443, cipher: 'chacha20-ietf-poly1305', password: 'p@ss',
    })
  })

  it('rejects plugins rather than dropping their semantics', () => {
    const userinfo = Buffer.from('aes-128-gcm:test-pass').toString('base64url')
    expect(() => parseShadowsocksUri(
      `ss://${userinfo}@ss.example.com:8388?plugin=v2ray-plugin#Plugin`,
    )).toThrow('首版不支持 Shadowsocks 插件')
  })
})
