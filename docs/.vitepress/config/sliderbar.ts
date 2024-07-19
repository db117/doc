import { scanDir } from './utils'

export default {

	'/java/': scanDir('java'),
	'/os/': scanDir('os'),
	'/AI/': scanDir('AI'),
	'/database/': scanDir('database'),
	'/ops/': scanDir('ops'),
	'/other/': scanDir('other'),
	'/util/': scanDir('util'),

}
