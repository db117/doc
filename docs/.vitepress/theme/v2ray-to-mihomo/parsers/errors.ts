/** 单个代理节点字段校验失败时抛出的错误。 */
export class NodeParseError extends Error {
  /** 创建带稳定错误代码的节点解析错误。 */
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'NodeParseError'
  }
}

/** 将输入校验并转换为 1 到 65535 的整数端口。 */
export function parsePort(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new NodeParseError('invalid-port', '端口必须在 1 到 65535 之间')
  }
  const port = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new NodeParseError('invalid-port', '端口必须在 1 到 65535 之间')
  }
  return port
}

/** 读取并清理必填字符串字段。 */
export function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NodeParseError('missing-field', `缺少必填字段：${field}`)
  }
  return value.trim()
}
