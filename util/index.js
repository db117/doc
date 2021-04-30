const fs = require('fs');
const yamlFront = require('yaml-front-matter');
// 排除的目录
let excludes = ['.vuepress','img'];

const utils = {
    // 侧边栏
    genSidebar: function (title, children = [''], collapsable = true, sidebarDepth = 3) {
        var arr = [];
        arr.push({
            title,
            collapsable,
            sidebarDepth,
            children
        });
        return arr;
    },
    // 路径下的文件夹数量
    countDir: function (fullPath) {
        let res = 0;
        fs.readdirSync(fullPath).forEach(file => {
            let full = `${fullPath}/${file}`;
            if (excludes.indexOf(file) < 0 && fs.statSync(full).isDirectory()) {
                res++;
            }
        });
        return res;
    },
    // 获取指定路径下的md文件(去除.md)
    getFileName: function (rpath) {
        let filenames = [];
        fs.readdirSync(rpath).forEach(file => {
            // 排查检查文件  过滤掉非md文件
            if (excludes.indexOf(file) < 0
                && file.substring(file.length - 2, file.length) === 'md') {
                fullpath = rpath + "/" + file;
                let stats = fs.statSync(fullpath);
                if (stats.isFile()) {
                    if (file === 'README.md') {
                        file = '';
                    } else {
                        file = file.replace('.md', '');
                    }
                    filenames.push(file);
                }
            }
        });
        // 排序
        filenames.sort();
        return filenames;
    },
    // 标题,md文件的title属性
    getTitle: function f(fullPath) {
        if (!fs.existsSync(fullPath + '/README.md')) {
            return fullPath.split('/').pop();
        }
        let buffer = fs.readFileSync(fullPath + '/README.md');
        let front = yamlFront.loadFront(buffer);
        if (front.title) {
            return front.title;
        }
        return fullPath.split('/').pop();
    }
};

module.exports = utils;