import { describe, expect, it, vi } from 'vitest'
import {
  FetchSubscriptionError,
  fetchSubscription,
} from '../../docs/.vitepress/theme/v2ray-to-mihomo/fetch-subscription'

describe('fetchSubscription', () => {
  it('rejects unsupported URL schemes and HTTPS-to-HTTP mixed content without exposing the URL', async () => {
    const secretUrl = 'file:///secret-token'

    await expect(fetchSubscription(secretUrl, { pageProtocol: 'https:' }))
      .rejects.toMatchObject({ kind: 'invalid-url' })
    await expect(fetchSubscription('http://sub.example/list', { pageProtocol: 'https:' }))
      .rejects.toMatchObject({ kind: 'mixed-content' })
    await expect(fetchSubscription(secretUrl, { pageProtocol: 'https:' }))
      .rejects.not.toThrow(secretUrl)
  })

  it('fetches with omitted credentials and no referrer', async () => {
    const fetchImpl = vi.fn(async () => new Response('  payload  ', { status: 200 })) as typeof fetch

    await expect(fetchSubscription('https://sub.example/list', {
      pageProtocol: 'https:', fetchImpl,
    })).resolves.toBe('payload')

    expect(fetchImpl).toHaveBeenCalledWith('https://sub.example/list', expect.objectContaining({
      credentials: 'omit', referrerPolicy: 'no-referrer', signal: expect.any(AbortSignal),
    }))
  })

  it('uses the global fetch implementation when one is not injected', async () => {
    const originalFetch = globalThis.fetch
    const fetchImpl = vi.fn(async () => new Response('payload', { status: 200 })) as typeof fetch
    globalThis.fetch = fetchImpl

    try {
      await expect(fetchSubscription('https://sub.example/list')).resolves.toBe('payload')
      expect(fetchImpl).toHaveBeenCalledOnce()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('clears its timeout after a completed request', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const fetchImpl = vi.fn(async () => new Response('payload', { status: 200 })) as typeof fetch

    try {
      await fetchSubscription('https://sub.example/list', { fetchImpl })
      expect(clearTimeoutSpy).toHaveBeenCalledOnce()
    } finally {
      clearTimeoutSpy.mockRestore()
    }
  })

  it('classifies HTTP, empty, network, and timeout failures', async () => {
    const http = vi.fn(async () => new Response('bad', { status: 503 })) as typeof fetch
    const empty = vi.fn(async () => new Response('   ', { status: 200 })) as typeof fetch
    const network = vi.fn(async () => { throw new TypeError('Failed to fetch') }) as typeof fetch
    const hanging = vi.fn((_url, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })) as typeof fetch

    await expect(fetchSubscription('https://sub.example/list', { fetchImpl: http }))
      .rejects.toMatchObject({ kind: 'http', status: 503 })
    await expect(fetchSubscription('https://sub.example/list', { fetchImpl: empty }))
      .rejects.toMatchObject({ kind: 'empty' })
    await expect(fetchSubscription('https://sub.example/list', { fetchImpl: network }))
      .rejects.toMatchObject({ kind: 'network-or-cors' })
    await expect(fetchSubscription('https://sub.example/list', { fetchImpl: hanging, timeoutMs: 5 }))
      .rejects.toMatchObject({ kind: 'timeout' })
  })

  it('keeps errors typed for callers', () => {
    const error = new FetchSubscriptionError('empty', 'Subscription is empty')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('FetchSubscriptionError')
  })
})
