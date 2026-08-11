const URI_LINE = /^[a-z][a-z0-9+.-]*:\/\//i

/** 订阅文本无法按 UTF-8 Base64 解码时抛出的错误。 */
export class SubscriptionDecodeError extends Error {
  /** 创建一条订阅解码错误。 */
  constructor(message: string) {
    super(message)
    this.name = 'SubscriptionDecodeError'
  }
}

/** 将标准或 URL-safe Base64 文本解码为 UTF-8 字符串。 */
export function decodeBase64Utf8(input: string): string {
  const compact = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (!compact || /[^A-Za-z0-9+/=]/.test(compact)) {
    throw new SubscriptionDecodeError('订阅内容不是有效的 Base64')
  }

  const padded = compact.padEnd(compact.length + ((4 - (compact.length % 4)) % 4), '=')
  try {
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new SubscriptionDecodeError('订阅内容不是有效的 UTF-8 Base64')
  }
}

/** 将文本拆分为去除 BOM 和空行的节点行。 */
function nonEmptyLines(input: string): string[] {
  return input.replace(/^\uFEFF/, '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
}

/** 识别明文或 Base64 订阅并返回非空节点链接。 */
export function decodeSubscriptionLines(input: string): string[] {
  const trimmed = input.replace(/^\uFEFF/, '').trim()
  if (!trimmed) throw new SubscriptionDecodeError('订阅内容为空')

  const directLines = nonEmptyLines(trimmed)
  if (directLines.some(line => URI_LINE.test(line))) return directLines

  const decodedLines = nonEmptyLines(decodeBase64Utf8(trimmed))
  if (!decodedLines.some(line => URI_LINE.test(line))) {
    throw new SubscriptionDecodeError('未找到节点链接')
  }
  return decodedLines
}
