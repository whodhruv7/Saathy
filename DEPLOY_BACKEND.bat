@echo off
echo ==========================================
echo  DEPLOY BACKEND EDGE FUNCTIONS
echo ==========================================
echo.
echo This will deploy YOUR backend with YOUR API keys
echo Users will NEVER see these keys
echo.
echo Press any key to continue...
pause >nul

echo.
echo Setting YOUR API keys in Supabase...
echo.

REM Set YOUR OpenRouter key (primary for pipeline)
npx supabase secrets set OPENROUTER_API_KEY=%OPENROUTER_API_KEY% --project-ref vwcqhznkajipsummeemv

echo.
echo [1/1] Deploying pipeline function...
npx supabase functions deploy pipeline --project-ref vwcqhznkajipsummeemv

echo.
echo ==========================================
echo  BACKEND DEPLOYED!
echo ==========================================
echo.
echo Your API key is now safely on Supabase.
echo The multi-model pipeline with 11-13 models is deployed.
echo.
echo Test the app:
echo 1. npm run dev
echo 2. Open browser
echo 3. Sign up and chat
echo 4. Try research mode for multi-model pipeline
echo.
pause
