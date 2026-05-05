@echo off
echo ==========================================
echo  DEPLOY CALL-MODEL EDGE FUNCTION
echo ==========================================
echo.
echo This deploys the new call-model proxy function
echo.
echo Press any key to continue...
pause >nul

echo.
echo [1/3] Setting OPENROUTER_API_KEY...
npx supabase secrets set OPENROUTER_API_KEY=%OPENROUTER_API_KEY% --project-ref vwcqhznkajipsummeemv

echo.
echo [2/3] Setting GROQ_API_KEY...
npx supabase secrets set GROQ_API_KEY=%GROQ_API_KEY% --project-ref vwcqhznkajipsummeemv

echo.
echo [3/3] Deploying call-model function...
npx supabase functions deploy call-model --project-ref vwcqhznkajipsummeemv

echo.
echo ==========================================
echo  DEPLOYMENT COMPLETE!
echo ==========================================
echo.
echo Now run: npm run dev
echo.
pause
