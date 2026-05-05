@echo off
echo ==========================================
echo DEPLOYING SAATHY PIPELINE EDGE FUNCTION
echo ==========================================
echo.

REM Check if supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Supabase CLI not found!
    echo Install with: npm install -g supabase
    pause
    exit /b 1
)

echo Setting OPENROUTER_API_KEY secret...
supabase secrets set OPENROUTER_API_KEY=%OPENROUTER_API_KEY% --project-ref vwcqhznkajipsummeemv

echo.
echo Deploying pipeline function...
supabase functions deploy pipeline --project-ref vwcqhznkajipsummeemv

echo.
echo ==========================================
echo DEPLOY COMPLETE!
echo ==========================================
echo.
echo Test the pipeline:
echo 1. Open browser console (F12)
echo 2. Send a research query
echo 3. Check console logs
echo.
pause
