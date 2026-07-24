import { describe, expect, it } from 'vitest'
import { parseHttpSubscriptionUrl } from '../../docs/.vitepress/theme/v2ray-to-mihomo/subscription-url'

describe('parseHttpSubscriptionUrl', () => {
  it('accepts current HTTP and HTTPS subscription values', () => {
    expect(parseHttpSubscriptionUrl('https://sub.example/list')?.href)
      .toBe('https://sub.example/list')
    expect(parseHttpSubscriptionUrl('http://sub.example/list')?.href)
      .toBe('http://sub.example/list')
  })

  it('rejects malformed and non-HTTP subscription values', () => {
    expect(parseHttpSubscriptionUrl('javascript:alert(1)')).toBeNull()
    expect(parseHttpSubscriptionUrl('file:///private/subscription')).toBeNull()
    expect(parseHttpSubscriptionUrl('not a URL')).toBeNull()
  })
})
