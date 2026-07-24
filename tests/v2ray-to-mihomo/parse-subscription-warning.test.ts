import { describe, expect, it, vi } from 'vitest'

vi.mock('../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/vless', async () => {
  const { NodeParseError } = await import(
    '../../docs/.vitepress/theme/v2ray-to-mihomo/parsers/errors'
  )
  return {
    parseVlessUri: () => {
      throw new NodeParseError('unknown-secret-code', 'unknown-secret-message')
    },
  }
})

import { parseSubscription } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parse-subscription'

describe('parseSubscription warning boundary', () => {
  it('maps unknown parser error codes to a fixed generic warning', () => {
    const result = parseSubscription(
      'vless://11111111-1111-4111-8111-111111111111@one.example:443#One',
    )

    expect(result.warnings).toEqual([{
      line: 1,
      protocol: 'vless',
      code: 'parse-failed',
      message: '节点格式无效',
    }])
    expect(JSON.stringify(result.warnings)).not.toContain('unknown-secret')
  })
})
