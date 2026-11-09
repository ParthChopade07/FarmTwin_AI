# FarmTwin Backend Self-Healing Supervisor / Watchdog
# Ensures backend is always revived if stopped or crashed

$ErrorActionPreference = "SilentlyContinue"
$BackendDir = "C:\Users\dhuma\OneDrive\Documents\CEP\FarmTwin\FarmTwin\FarmTwin\agritwin\backend"
$PythonExe = "$BackendDir\venv\Scripts\python.exe"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " FarmTwin Backend Sentinel Watchdog Active " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

while ($true) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get -TimeoutSec 3
        if ($response.status -eq "ok") {
            # Healthy
        }
    } catch {
        Write-Host "[!] Backend unresponsive or down at $(Get-Date -Format 'HH:mm:ss'). Reviving..." -ForegroundColor Yellow
        $running = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
        if ($running) {
            Stop-Process -Id $running.OwningProcess -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        }
        Start-Process cmd -ArgumentList "/k", "cd /d `"$BackendDir`" && `"$PythonExe`" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Minimized
        Write-Host "[+] Restart command dispatched." -ForegroundColor Green
    }
    Start-Sleep -Seconds 10
}
