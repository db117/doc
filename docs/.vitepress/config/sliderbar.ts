import { scanDir } from './utils'

export default {

	'/java/': scanDir('java'),
	'/os/': scanDir('os'),
	'/algorithm/': scanDir('algorithm'),
	'/database/': scanDir('database'),
	'/ops/': scanDir('ops'),
	'/other/': scanDir('other'),
	'/util/': scanDir('util'),

}
