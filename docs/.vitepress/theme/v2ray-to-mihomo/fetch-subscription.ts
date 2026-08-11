/** 浏览器读取订阅失败的稳定错误分类。 */
export type FetchFailureKind =
  | 'invalid-url'
  | 'mixed-content'
  | 'timeout'
  | 'http'
  | 'network-or-cors'
  | 'empty'

/** 携带失败分类和可选 HTTP 状态的订阅读取错误。 */
export class FetchSubscriptionError extends Error {
  /** 创建一条可供界面分类处理的订阅读取错误。 */
  constructor(
    public readonly kind: FetchFailureKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'FetchSubscriptionError'
  }
}

/** 订阅请求的环境与测试配置。 */
export interface FetchSubscriptionOptions {
  /** 当前页面协议，用于提前阻止混合内容请求。 */
  pageProtocol?: string
  /** 请求超时时间，单位为毫秒。 */
  timeoutMs?: number
  /** 替代全局 fetch 的请求实现。 */
  fetchImpl?: typeof fetch
}

/** 安全读取 HTTP(S) 订阅文本并统一映射网络错误。 */
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
