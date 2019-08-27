const path = require("path");
const rootpath = path.dirname(__dirname) ;//执行一次dirname将目录定位到docs的上级目录，也就是博客根目录
const docs = rootpath + "/docs/";
const utils = require(rootpath + '/util/index.js');
const filehelper = require(rootpath + '/util/getFilenames.js');

/**
 * 侧边栏的配置（顺序无所谓）
 * utils.genSidebar('Java基础', filehelper.getFileName(docs+"/Java/Basic/"), false),
 */
module.exports = {
    '/java/': utils.genSidebar('java', filehelper.getFileName(docs + "/java/")),
    '/docker/': utils.genSidebar('docker', filehelper.getFileName(docs + "/docker/")),
    '/os/linux/': utils.genSidebar('linux', filehelper.getFileName(docs + "/os/linux/")),
    '/os/windows/': utils.genSidebar('windows', filehelper.getFileName(docs + "/os/windows/")),
    '/os/centos/': utils.genSidebar('centos', filehelper.getFileName(docs + "/os/centos/")),
    '/os/ubuntu/': utils.genSidebar('ubuntu', filehelper.getFileName(docs + "/os/ubuntu/")),
    '/database/mysql/': utils.genSidebar('mysql', filehelper.getFileName(docs + "/database/mysql/")),
    '/database/redis/': utils.genSidebar('redis', filehelper.getFileName(docs + "/database/redis/")),
    '/util/git/': utils.genSidebar('git', filehelper.getFileName(docs + "/util/git/")),
    '/util/nginx/': utils.genSidebar('nginx', filehelper.getFileName(docs + "/util/nginx/")),
    '/other/': utils.genSidebar('其他', filehelper.getFileName(docs + "/other/")),
    '/': utils.genSidebar('导航', filehelper.getFileName(docs + "/")),

    // 一定要放在最后！！！
    // 根目录下的 sidebar, 对于所有未匹配到的都会应用该 sidebar
    // '/': [''] // 此处选择禁用
};