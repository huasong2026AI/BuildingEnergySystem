@echo off
chcp 65001 >nul
title 建筑暖通能耗分析与改造专家系统

echo ========================================================
echo   🏢 建筑暖通能耗分析与改造专家系统 - 快速启动脚本
echo ========================================================
echo.

cd /d "%~dp0"

:: 检查 node 是否已安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js 环境，请先安装 Node.js (https://nodejs.org/)。
    echo.
    pause
    exit /b 1
)

:: 检查 node_modules 是否存在
if not exist "node_modules\" (
    echo [提示] 检测到首次运行，正在自动安装项目依赖 (npm install)...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败，请检查网络后重试。
        pause
        exit /b 1
    )
)

echo [1/2] 正在启动本地开发服务器 (npm run dev)...
echo [2/2] 服务启动后将自动为您打开浏览器...
echo.
echo 访问地址: http://localhost:5173/
echo.
echo * 提示: 请保持本窗口开启以维持系统运行。按 Ctrl+C 可停止运行。
echo ========================================================
echo.

:: 延迟 2 秒自动在默认浏览器中打开网页
start "" http://localhost:5173/

:: 启动 Vite 开发服务
call npm run dev

pause
