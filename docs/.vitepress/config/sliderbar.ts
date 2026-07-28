import {scanDir} from './utils'

export default {

	'/java/': scanDir('java'),
	'/ai/': scanDir('ai'),
	'/infrastructure/os/': scanDir('infrastructure/os'),
	'/infrastructure/database/': scanDir('infrastructure/database'),
	'/infrastructure/ops/': scanDir('infrastructure/ops'),
	'/tools/': scanDir('tools'),
	'/other/': scanDir('other'),

}
