# Check if Python is installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python is not installed or not in PATH"
    exit 1
}

Write-Host "Cleaning up old virtual environment..."
if (Test-Path "venv") {
    Remove-Item -Recurse -Force "venv"
}

Write-Host "Creating new virtual environment..."
python -m venv venv

Write-Host "Activating virtual environment..."
.\venv\Scripts\Activate.ps1

Write-Host "Installing requirements..."
pip install -r requirements.txt

Write-Host "Setup complete!"
Write-Host "To activate the environment later, use: .\venv\Scripts\Activate.ps1"

Read-Host -Prompt "Press Enter to exit"
