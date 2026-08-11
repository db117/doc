/** 解析 HTTP(S) 订阅地址，不安全或无效地址返回 `null`。 */
export function parseHttpSubscriptionUrl(value: string): URL | null {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null
  } catch {
    return null
  }
}
