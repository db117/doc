#代码在Travis中编译完成后，顺便部署到gitee pages中
#!/bin/bash
cd docs/.vuepress/dist
git config user.name "在那遥远的瞬间"
git config user.email "z351622948@163.com"
git config user.password "$1"
git init
git add .
git commit -m "发布pages"
git remote add origin https://gitee.com/db117/db117.git
git push --force origin master:master