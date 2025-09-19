@echo off
title GSR App Data Backup

echo.
echo =======================================================
echo Starting automated data backup to GitHub...
echo =======================================================
echo.

:: Stage the CSV file. You might need to change the path if the file is in a different folder.
git add public/gsr_data.csv

:: Check if git add was successful.
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to stage the CSV file. Check the file path and try again.
    echo.
    pause
    exit /b 1
)

:: Commit the staged file with a unique, timestamped message.
git commit -m "Automated data backup on %date% at %time%"

:: Check if git commit was successful.
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to create a new commit.
    echo.
    pause
    exit /b 1
)

echo.
echo Pushing the backup to GitHub...

:: Push the commit to the remote repository.
git push

:: Check if git push was successful.
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Push failed. Check your internet connection or GitHub credentials.
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo =======================================================
    echo Data backup was successful!
    echo =======================================================
    echo.
)

pause
exit /b 0