@echo off
chcp 437 >nul
cd /d "%~dp0.."
node scripts/dl-portfolio-puppeteer.mjs
pause
