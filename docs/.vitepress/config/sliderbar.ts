import {scanDir} from './utils'

export default {

	'/java/': scanDir('java'),
	'/ai/': scanDir('ai'),
	'/infrastructure/os/': scanDir('infrastructure/os'),
	'/infrastructure/database/': scanDir('infrastructure/database'),
	'/infrastructure/ops/': scanDir('infrastructure/ops'),
	'/tools/': [
		{
			text: '美股期权策略构建器',
			link: '/tools/options-strategy',
			collapsible: true,
			items: [
				{text: '本地使用指南', link: '/tools/options-strategy-local-setup'},
			],
		},
		{
			text: '个人净资产追踪',
			link: '/tools/net-worth',
			collapsible: true,
			items: [
				{text: '使用指南', link: '/tools/net-worth-guide'},
			],
		},
		{text: 'V2Ray 订阅转 Clash Verge 配置', link: '/tools/v2ray-to-clash'},
	],
	'/other/': scanDir('other'),

}
