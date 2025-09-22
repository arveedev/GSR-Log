@echo off
set /p commitMessage="Enter your commit message: "
echo.

echo Checking Git status...
git status
echo.

echo Adding all changes...
git add .
echo.

echo Committing changes with message: "%commitMessage%"
git commit -m "%commitMessage%"
echo.

echo Pulling latest changes from remote repository...
git pull origin main
echo.

echo Pushing changes to GitHub...
git push origin main
echo.

echo Automation complete!
pause