# 建筑暖通能耗分析与改造专家系统 - PowerShell 快速启动脚本
$Host.UI.RawUI.WindowTitle = "建筑暖通能耗分析与改造专家系统"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🏢 建筑暖通能耗分析与改造专家系统 - 快速启动脚本" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path $PSScriptRoot

# 检查 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[错误] 未检测到 Node.js 环境，请先安装 Node.js (https://nodejs.org/)" -ForegroundColor Red
    Read-Host "按回车键退出..."
    exit 1
}

# 检查 node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[提示] 首次运行，正在安装依赖包 (npm install)..." -ForegroundColor Yellow
    npm install
}

Write-Host "[1/2] 正在启动 Vite 开发服务器..." -ForegroundColor Green
Write-Host "[2/2] 正在自动打开默认浏览器访问系统..." -ForegroundColor Green
Write-Host ""
Write-Host "访问地址: http://localhost:5173/" -ForegroundColor Yellow
Write-Host "* 提示: 保持本窗口运行即可维持系统服务，按 Ctrl+C 可停止运行。" -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 打开浏览器
Start-Process "http://localhost:5173/"

# 运行 Vite 开发服务器
npm run dev
