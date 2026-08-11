import { decodeBase64Utf8 } from '../codec'
import type { ShadowsocksNode } from '../types'
import { NodeParseError, parsePort, requireText } from './errors'

/** 解码 URI 片段并将编码异常转换为节点错误。 */
function decodeUriComponent(value: string, field: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    throw new NodeParseError('invalid-encoding', `${field} 包含无效的 URL 编码`)
  }
}

/** 拆分 Shadowsocks 加密方式和密码。 */
function splitCredential(value: string): { cipher: string; password: string } {
  const colon = value.indexOf(':')
  if (colon <= 0 || colon === value.length - 1) {
    throw new NodeParseError('invalid-ss-credential', 'Shadowsocks 缺少加密方式或密码')
  }
  return {
    cipher: decodeUriComponent(value.slice(0, colon), 'Shadowsocks 加密方式'),
    password: decodeUriComponent(value.slice(colon + 1), 'Shadowsocks 密码'),
  }
}

/** 拆分支持 IPv4、域名和 IPv6 的服务器地址与端口。 */
function splitServer(value: string): { server: string; port: number } {
  if (value.startsWith('[')) {
    const closingBracket = value.indexOf(']')
    if (closingBracket === -1 || value[closingBracket + 1] !== ':') {
      throw new NodeParseError('invalid-ss-uri', 'Shadowsocks 地址缺少服务器')
    }
    return {
      server: requireText(value.slice(1, closingBracket), '服务器'),
      port: parsePort(value.slice(closingBracket + 2)),
    }
  }

  const colon = value.lastIndexOf(':')
  if (colon <= 0) throw new NodeParseError('invalid-ss-uri', 'Shadowsocks 地址缺少服务器')
  return {
    server: requireText(value.slice(0, colon), '服务器'),
    port: parsePort(value.slice(colon + 1)),
  }
}

/** 解析 SIP002 Shadowsocks URI 为统一节点结构。 */
export function parseShadowsocksUri(uri: string): ShadowsocksNode {
  const source = uri.startsWith('ss://') ? uri.slice('ss://'.length) : uri
  const hash = source.indexOf('#')
  const withoutFragment = hash === -1 ? source : source.slice(0, hash)
  const fragment = hash === -1 ? '' : source.slice(hash + 1)
  const query = withoutFragment.indexOf('?')
  const authority = query === -1 ? withoutFragment : withoutFragment.slice(0, query)
  const params = new URLSearchParams(query === -1 ? '' : withoutFragment.slice(query + 1))

  if (params.getAll('plugin').some(value => value !== '')) {
    throw new NodeParseError('unsupported-ss-plugin', '首版不支持 Shadowsocks 插件')
  }

  const at = authority.lastIndexOf('@')
  const decodedAuthority = at === -1
    ? decodeBase64Utf8(authority)
    : `${decodeBase64Utf8(authority.slice(0, at))}${authority.slice(at)}`
  const decodedAt = decodedAuthority.lastIndexOf('@')
  if (decodedAt <= 0) throw new NodeParseError('invalid-ss-uri', 'Shadowsocks 地址缺少服务器')

  const credential = splitCredential(decodedAuthority.slice(0, decodedAt))
  const server = splitServer(decodedAuthority.slice(decodedAt + 1))
  return {
    type: 'ss',
    name: decodeUriComponent(fragment, '节点名称') || '未命名节点',
    ...server,
    ...credential,
    transport: { network: 'tcp' },
  }
}
