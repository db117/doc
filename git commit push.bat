git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Git 未安装或未配置为全局可用。
    exit /b %errorlevel%
)

@echo off
setlocal

REM 提示用户输入提交信息
set /p commit_message=请输入提交信息: 

REM 检查提交信息是否为空
if "%commit_message%"=="" (
    echo 提交信息不能为空，请重新运行脚本并输入有效的提交信息。
    exit /b 1
)

REM 打印提交信息以确认
echo 你的提交信息是: %commit_message%

REM 执行 git add .
git add .

REM 检查 git add 的结果
if %errorlevel% neq 0 (
    echo git add 失败。
    exit /b %errorlevel%
)

REM 执行 git commit -m "提交信息"
git commit -m "%commit_message%"
if %errorlevel% neq 0 (
    echo git commit 失败。
    exit /b %errorlevel%
)

echo git commit 成功，提交信息：%commit_message%
endlocal
exit /b 0
