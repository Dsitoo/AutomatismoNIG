@echo off
echo Cleaning up old virtual environment...
rmdir /s /q venv

echo Creating new virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing requirements...
pip install -r requirements.txt

echo Setup complete!
echo To activate the environment later, use: venv\Scripts\activate.bat
pause
