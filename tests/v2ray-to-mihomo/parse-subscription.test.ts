import { describe, expect, it } from 'vitest'
import { parseSubscription } from '../../docs/.vitepress/theme/v2ray-to-mihomo/parse-subscription'

const vless = 'vless://11111111-1111-4111-8111-111111111111@one.example:443?security=tls#Node'
const trojan = 'trojan://secret@two.example:443?security=tls#Node'
const reserved = 'trojan://secret@three.example:443?security=tls#%E8%87%AA%E5%8A%A8%E9%80%89%E6%8B%A9'

describe('parseSubscription', () => {
  it('decodes, dispatches, counts, renames, and keeps safe warnings', () => {
    const raw = [vless, 'ssr://secret-value', trojan, reserved].join('\n')
    const result = parseSubscription(Buffer.from(raw, 'utf8').toString('base64'))

    expect(result.nodes.map(node => node.name)).toEqual(['Node', 'Node #2', '自动选择 #2'])
    expect(result.counts).toEqual({ vmess: 0, vless: 1, trojan: 2, ss: 0 })
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ line: 2, protocol: 'ssr', code: 'unsupported-protocol' }),
      expect.objectContaining({ line: 3, code: 'renamed-node' }),
      expect.objectContaining({ line: 4, code: 'renamed-node' }),
    ]))
    expect(JSON.stringify(result.warnings)).not.toContain('secret-value')
  })

  it('returns no nodes for an entirely invalid list', () => {
    const result = parseSubscription('ssr://hidden\nnot-a-uri')
    expect(result.nodes).toEqual([])
    expect(result.warnings).toHaveLength(2)
  })

  it('treats inherited property schemes as unsupported', () => {
    const result = parseSubscription('constructor://credential@host.example')

    expect(result.nodes).toEqual([])
    expect(result.warnings).toEqual([
      expect.objectContaining({ protocol: 'constructor', code: 'unsupported-protocol' }),
    ])
    expect(JSON.stringify(result.warnings)).not.toContain('credential')
  })
})
