export class NodeParseError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'NodeParseError'
  }
}

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

export function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NodeParseError('missing-field', `缺少必填字段：${field}`)
  }
  return value.trim()
}
