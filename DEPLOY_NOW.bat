@echo off
echo ==========================================
echo  SAATHY PIPELINE DEPLOYMENT
echo ==========================================
echo.
echo This will:
echo 1. Set OPENROUTER_API_KEY secret
echo 2. Deploy the pipeline edge function
echo.
echo Press any key to continue...
pause >nul

echo.
echo [1/2] Setting API key secret...
npx supabase secrets set OPENROUTER_API_KEY=%OPENROUTER_API_KEY% --project-ref vwcqhznkajipsummeemv

echo.
echo [2/2] Deploying pipeline function...
npx supabase functions deploy pipeline --project-ref vwcqhznkajipsummeemv

echo.
echo ==========================================
echo  DEPLOYMENT COMPLETE!
echo ==========================================
echo.
echo Now test it:
echo 1. npm run dev
echo 2. Open browser, press F12 for console
echo 3. Send a message
echo 4. Check console logs
echo.
pause
