import { describe, expect, it } from 'vitest'
import {
  SubscriptionDecodeError,
  decodeBase64Utf8,
  decodeSubscriptionLines,
} from '../../docs/.vitepress/theme/v2ray-to-mihomo/codec'

describe('subscription codec', () => {
  it('decodes standard and URL-safe Base64 without padding', () => {
    const source = 'vmess://first\nvless://第二个'
    const standard = Buffer.from(source, 'utf8').toString('base64')
    const urlSafe = standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    expect(decodeBase64Utf8(standard)).toBe(source)
    expect(decodeBase64Utf8(urlSafe)).toBe(source)
  })

  it('keeps URI lines and removes BOM, CRLF, and blank lines', () => {
    const input = '\uFEFFvmess://one\r\n\r\nssr://unsupported\r\nvless://two\r\n'
    expect(decodeSubscriptionLines(input)).toEqual([
      'vmess://one',
      'ssr://unsupported',
      'vless://two',
    ])
  })

  it('decodes an entire Base64 subscription', () => {
    const encoded = Buffer.from('trojan://one\nss://two', 'utf8').toString('base64')
    expect(decodeSubscriptionLines(encoded)).toEqual(['trojan://one', 'ss://two'])
  })

  it('rejects empty or undecodable content', () => {
    expect(() => decodeSubscriptionLines('  ')).toThrow(SubscriptionDecodeError)
    expect(() => decodeSubscriptionLines('not a subscription')).toThrow(SubscriptionDecodeError)
  })
})
