@echo off
setlocal enabledelayedexpansion

REM Slidesager Setup Script for Windows
REM This script sets up the development environment for Slidesager

echo 🎯 Setting up Slidesager - AI PowerPoint Generator
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=1 delims=." %%a in ('node --version') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% lss 18 (
    echo ❌ Node.js version 18 or higher is required. Current version: 
    node --version
    echo    Please update Node.js and try again.
    pause
    exit /b 1
)

echo ✅ Node.js detected:
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)

echo ✅ npm detected:
npm --version

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Install Marp CLI globally if not already installed
marp --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo 📋 Installing Marp CLI globally...
    call npm install -g @marp-team/marp-cli
    if errorlevel 1 (
        echo ❌ Failed to install Marp CLI
        pause
        exit /b 1
    )
    echo ✅ Marp CLI installed successfully
) else (
    echo ✅ Marp CLI already installed:
    marp --version
)

REM Create temp directory for Marp outputs
echo.
echo 📁 Creating temp directory...
if not exist temp mkdir temp
echo ✅ Temp directory created

REM Create .env file if it doesn't exist
if not exist .env (
    echo.
    echo 📝 Creating .env file...
    (
        echo # Slidesager Environment Variables
        echo # These are optional - users can enter API keys directly in the UI
        echo.
        echo # OpenAI API Key ^(optional^)
        echo # OPENAI_API_KEY=your_openai_api_key_here
        echo.
        echo # Anthropic API Key ^(optional^)
        echo # ANTHROPIC_API_KEY=your_anthropic_api_key_here
        echo.
        echo # Google Gemini API Key ^(optional^)
        echo # GEMINI_API_KEY=your_gemini_api_key_here
        echo.
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
    ) > .env
    echo ✅ .env file created with default configuration
    echo    You can edit this file to add default API keys ^(optional^)
) else (
    echo ✅ .env file already exists
)

REM Check if git is available and initialize if needed
git --version >nul 2>&1
if not errorlevel 1 (
    if not exist .git (
        echo.
        echo 🔧 Initializing git repository...
        git init
        echo ✅ Git repository initialized
    )
    
    REM Create .gitignore if it doesn't exist
    if not exist .gitignore (
        echo.
        echo 📝 Creating .gitignore...
        (
            echo # Dependencies
            echo node_modules/
            echo npm-debug.log*
            echo yarn-debug.log*
            echo yarn-error.log*
            echo.
            echo # Environment variables
            echo .env
            echo .env.local
            echo .env.development.local
            echo .env.test.local
            echo .env.production.local
            echo.
            echo # Build outputs
            echo dist/
            echo build/
            echo.
            echo # Temp files
            echo temp/
            echo *.tmp
            echo *.temp
            echo.
            echo # IDE files
            echo .vscode/
            echo .idea/
            echo *.swp
            echo *.swo
            echo.
            echo # OS files
            echo .DS_Store
            echo Thumbs.db
            echo.
            echo # Logs
            echo logs/
            echo *.log
            echo.
            echo # Runtime data
            echo pids/
            echo *.pid
            echo *.seed
            echo *.pid.lock
            echo.
            echo # Coverage directory used by tools like istanbul
            echo coverage/
            echo.
            echo # API keys and secrets ^(extra safety^)
            echo *api_key*
            echo *secret*
            echo *token*
        ) > .gitignore
        echo ✅ .gitignore created
    )
)

REM Build the project
echo.
echo 🔨 Building the project...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo 🎉 Setup complete!
echo.
echo 🚀 To start the development server:
echo    npm run dev
echo.
echo 🌐 The application will be available at:
echo    http://localhost:5000
echo.
echo 📚 For more information, see the README.md file
echo.
echo ⚠️  Remember to:
echo    1. Get API keys from your preferred LLM provider
echo    2. Enter them in the UI when generating presentations
echo    3. Never commit API keys to version control
echo.
echo Happy presenting! 🎯
echo.
pause
