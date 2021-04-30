const fs = require('fs');
const path = require("path");
const rootPath = path.dirname(__dirname);//执行一次dirname将目录定位到docs的上级目录，也就是博客根目录
const docs = rootPath + "/docs/";
const utils = require(rootPath + '/util/index.js');
const fileUtil = require(rootPath + '/util/getFilenames.js');

// 排除的目录
let excludes = ['.vuepress','img'];

const build = {
    // 获取导航栏
    nav: function () {
        let res = [];
        // 首页
        res.push({text: utils.getTitle(docs), link: "/"});
        // 根目录下每一个文件夹为一个导航栏
        fs.readdirSync(docs).forEach(file => {
            if (excludes.indexOf(file) < 0) {
                let fullPath = `${docs}/${file}`;
                if (fs.existsSync(fullPath)) {
                    let fileInfo = fs.statSync(fullPath);
                    if (fileInfo.isDirectory()) {
                        let title = utils.getTitle(fullPath);
                        // 添加导航栏
                        res.push({text: title, link: `/${file}/`})
                    }
                }
            }
        });
        console.log(res);
        return res;
    },
    // 左侧菜单栏
    sidebar: function () {
        let res = "{";
        fs.readdirSync(docs).forEach(file => {
            if (excludes.indexOf(file) < 0) {
                let path = `${docs}/${file}`;

                let fileInfo = fs.statSync(path);
                if (fileInfo.isDirectory()) {
                    if (utils.countDir(path) <= 0) {
                        // 该目录下没有没有了,不需要分组
                        let t = `"/${file}/":${JSON.stringify(utils.getFileName(path))},`;
                        res += t;
                    } else {
                        let groups = [];
                        // 获取当前目录分组
                        groups.push(this.group(path, ""));
                        // 子目录分组
                        fs.readdirSync(path).forEach(children => {
                            let childrenPath = `${path}/${children}`;
                            if (fs.statSync(childrenPath).isDirectory()) {
                                // 有目录才分组
                                groups.push(this.group(childrenPath, children));
                            }
                        });

                        let t = `"/${file}/":${JSON.stringify(groups)},`;

                        res += t;
                    }
                }
            }
        });
        // 最后加跟目录(坑了大半天)
        res += `"/": ${JSON.stringify(utils.getFileName(docs))}}`;

        let ans= JSON.parse(res);

        console.log(ans);
        return ans;
    },
    // 获取文件夹下的所以文件名称
    group: function (fullPath, path) {
        let res = [];
        if (path === '') {
            // 子目录的跟目录不加前缀
            res = utils.getFileName(fullPath);
        }else {
            utils.getFileName(fullPath).forEach(value => res.push(`${path}/${value}`));
        }
        return {
            title: utils.getTitle(fullPath),   // 必要的
            // path: path,      // 可选的, 应该是一个绝对路径
            collapsable: false, // 可选的, 默认值是 true,
            sidebarDepth: 2,    // 可选的, 默认值是 1
            children: res
        };
    }
};


module.exports = build;