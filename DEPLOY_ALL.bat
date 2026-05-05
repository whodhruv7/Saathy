@echo off
echo ==========================================
echo  DEPLOY ALL SAATHY EDGE FUNCTIONS
echo ==========================================
echo.
echo This will deploy all edge functions with CORS fixes
echo.
echo Press any key to continue...
pause >nul

echo.
echo [1/9] Setting API keys...
npx supabase secrets set OPENROUTER_API_KEY=%OPENROUTER_API_KEY% --project-ref vwcqhznkajipsummeemv
npx supabase secrets set GROQ_API_KEY=%GROQ_API_KEY% --project-ref vwcqhznkajipsummeemv

echo.
echo [2/9] Deploying groq-call...
npx supabase functions deploy groq-call --project-ref vwcqhznkajipsummeemv

echo.
echo [3/9] Deploying or-call...
npx supabase functions deploy or-call --project-ref vwcqhznkajipsummeemv

echo.
echo [4/9] Deploying pipeline...
npx supabase functions deploy pipeline --project-ref vwcqhznkajipsummeemv

echo.
echo [5/9] Deploying call-model...
npx supabase functions deploy call-model --project-ref vwcqhznkajipsummeemv

echo.
echo [6/9] Deploying chat...
npx supabase functions deploy chat --project-ref vwcqhznkajipsummeemv

echo.
echo [7/9] Deploying summarize...
npx supabase functions deploy summarize --project-ref vwcqhznkajipsummeemv

echo.
echo [8/9] Deploying merge-notes...
npx supabase functions deploy merge-notes --project-ref vwcqhznkajipsummeemv

echo.
echo [9/9] Deploying enhance-prompt...
npx supabase functions deploy enhance-prompt --project-ref vwcqhznkajipsummeemv

echo.
echo ==========================================
echo  ALL FUNCTIONS DEPLOYED!
echo ==========================================
echo.
echo Now test the app:
echo 1. npm run dev
echo 2. Open browser console (F12)
echo 3. Send a message
echo.
pause
