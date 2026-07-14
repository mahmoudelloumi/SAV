@echo off
REM ============================================================
REM  Lancement du projet SAV (backend + frontend)
REM  Ouvre deux fenetres : une pour l'API, une pour l'interface.
REM ============================================================

REM --- Configuration (heritee par les deux fenetres) ---
set "JAVA_HOME=C:\SAV\jdk21\jdk-21.0.11"
set "MAVEN_HOME=C:\tools\apache-maven-3.9.12"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"

echo ============================================
echo   Demarrage du projet SAV
echo   - Backend  : http://localhost:8080
echo   - Frontend : http://localhost:5173
echo ============================================
echo.

REM --- Backend (Spring Boot) : la fenetre herite de JAVA_HOME/PATH/DATABASE_PASSWORD ---
start "SAV - Backend" cmd /k "cd /d C:\SAV\backend && mvn spring-boot:run"

REM --- Frontend (Vite) ---
start "SAV - Frontend" cmd /k "cd /d C:\SAV\frontend && npm run dev"

echo Les deux fenetres ont ete ouvertes.
echo Fermez-les (ou Ctrl+C dans chacune) pour arreter le projet.
echo.
pause
