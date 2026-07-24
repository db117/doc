export type FetchFailureKind =
  | 'invalid-url'
  | 'mixed-content'
  | 'timeout'
  | 'http'
  | 'network-or-cors'
  | 'empty'

export class FetchSubscriptionError extends Error {
  constructor(
    public readonly kind: FetchFailureKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'FetchSubscriptionError'
  }
}

export interface FetchSubscriptionOptions {
  pageProtocol?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export async function fetchSubscription(
  url: string,
  options: FetchSubscriptionOptions = {},
): Promise<string> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new FetchSubscriptionError('invalid-url', '订阅地址无效，只支持 HTTP 或 HTTPS 地址。')
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new FetchSubscriptionError('invalid-url', '订阅地址无效，只支持 HTTP 或 HTTPS 地址。')
  }

  const pageProtocol = options.pageProtocol
    ?? (typeof window === 'undefined' ? '' : window.location.protocol)
  if (pageProtocol === 'https:' && parsedUrl.protocol === 'http:') {
    throw new FetchSubscriptionError('mixed-content', 'HTTPS 页面不能读取 HTTP 订阅地址。')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000)
  const fetchImpl = options.fetchImpl ?? globalThis.fetch

  try {
    const response = await fetchImpl(parsedUrl.href, {
      method: 'GET',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new FetchSubscriptionError('http', `订阅服务返回 HTTP ${response.status}。`, response.status)
    }

    const content = (await response.text()).trim()
    if (!content) {
      throw new FetchSubscriptionError('empty', '订阅内容为空。')
    }

    return content
  } catch (error) {
    if (controller.signal.aborted) {
      throw new FetchSubscriptionError('timeout', '读取订阅超时，请稍后重试或使用手动粘贴。')
    }
    if (error instanceof FetchSubscriptionError) {
      throw error
    }
    throw new FetchSubscriptionError('network-or-cors', '无法读取订阅，可能是网络或 CORS 限制。')
  } finally {
    clearTimeout(timeout)
  }
}
