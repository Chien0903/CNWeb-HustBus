# Script to run the entire HustBus project
# Run this script in PowerShell with admin rights if needed

Write-Host "Starting HustBus Project..." -ForegroundColor Green

# Function to run command in background
function Start-BackgroundJob {
    param (
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command
    )
    Write-Host "Starting $Name..." -ForegroundColor Yellow
    Start-Job -Name $Name -ScriptBlock {
        param($wd, $cmd)
        Set-Location $wd
        Invoke-Expression $cmd
    } -ArgumentList $WorkingDirectory, $Command
}

# 1. Run FastAPI (Port 8000)
$fastapiPath = Join-Path $PSScriptRoot "fastapi"
if (Test-Path $fastapiPath) {
    Write-Host "Checking Python environment for FastAPI..." -ForegroundColor Cyan
    # Assuming venv is created
    $venvPath = Join-Path $fastapiPath "venv\Scripts\Activate.ps1"
    if (Test-Path $venvPath) {
        $fastapiCommand = "& '$venvPath'; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    } else {
        $fastapiCommand = "uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    }
    Start-BackgroundJob -Name "FastAPI" -WorkingDirectory $fastapiPath -Command $fastapiCommand
} else {
    Write-Host "FastAPI folder not found!" -ForegroundColor Red
}

# 2. Run Backend (Node.js)
$backendPath = Join-Path $PSScriptRoot "HustBus_Backend"
if (Test-Path $backendPath) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
    Set-Location $backendPath
    npm install
    npx prisma generate
    # Assuming database is setup, skip migrate if needed
    # npx prisma migrate dev --name init
    Start-BackgroundJob -Name "Backend" -WorkingDirectory $backendPath -Command "npm run dev"
} else {
    Write-Host "Backend folder not found!" -ForegroundColor Red
}

# 3. Run Frontend (Vite)
$frontendPath = Join-Path $PSScriptRoot "HustBus_FrontEnd"
if (Test-Path $frontendPath) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location $frontendPath
    pnpm install
    Start-BackgroundJob -Name "Frontend" -WorkingDirectory $frontendPath -Command "pnpm dev"
} else {
    Write-Host "Frontend folder not found!" -ForegroundColor Red
}

Write-Host "`nAll services started!" -ForegroundColor Green
Write-Host "URLs:" -ForegroundColor Blue
Write-Host "  - FastAPI: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Backend: http://localhost:3000 (assuming)" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White

Write-Host "`nCheck running jobs:" -ForegroundColor Yellow
Get-Job

Write-Host "`nTo stop all, run: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Red

# Keep script running to see output
Read-Host "Press Enter to exit"