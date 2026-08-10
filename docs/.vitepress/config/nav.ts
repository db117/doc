import type {DefaultTheme} from 'vitepress'

const nav: DefaultTheme.NavItem[] = [
	{ text: '首页', link: '/' },
	{ text: 'AI', link: '/ai/' },
	{ text: 'Java', link: '/java/' },
	{
		text: '基础设施',
		items: [
			{ text: '数据库', link: '/infrastructure/database/' },
			{ text: '运维', link: '/infrastructure/ops/' },
			{ text: '系统', link: '/infrastructure/os/' },
		],
	},
	{
		text: '在线工具',
		items: [
			{text: '美股期权策略构建器', link: '/tools/options-strategy'},
            {text: '美股期权 3D 波动率曲面', link: '/tools/options-volatility-surface'},
            {text: '个人净资产追踪', link: '/tools/net-worth'},
			{ text: 'V2Ray 转 Clash 订阅', link: '/tools/v2ray-to-clash' },
		],
	},
	{ text: '知识碎片', link: '/other/' },
	{ text: '关于我', link: 'https://www.500d.me/cvresume/3244698236/' },
]


export default nav
