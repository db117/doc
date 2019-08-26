/**
 * 获取一个目录下的所有文件名
 * 使用方法：var filehelper = require('./getFilenames.js')
 * filehelper.getFileName("/Users/fangzheng/JavaDev/blog/docs/BigData/Flume/")
 */

const fs = require('fs');
// 排除检查的文件
var excludes = ['.DS_Store'];

var filehelper = {
    getFileName: function (rpath) {
        let filenames = [];
        fs.readdirSync(rpath).forEach(file => {
            // 排查检查文件  过滤掉非md文件
            if (excludes.indexOf(file) < 0
                && file.substring(file.length - 2, file.length) === 'md') {
                fullpath = rpath + "/" + file;
                var fileinfo = fs.statSync(fullpath);
                if (fileinfo.isFile()) {
                    if (file === 'README.md') {
                        file = '';
                    } else {
                        file = file.replace('.md', '');
                    }
                    filenames.push(file);
                }
            }
        });
        console.log(filenames);
        // 排序
        filenames.sort();
        return filenames;
    }
};
module.exports = filehelper;