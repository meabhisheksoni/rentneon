@echo off
setlocal EnableDelayedExpansion

set "REPO_ROOT=%~dp0"
cd /d "%REPO_ROOT%"

set "PYTHONIOENCODING=utf-8"
chcp 65001 >nul 2>&1

:MENU
cls
set "CBM_EXE="
if exist "%LOCALAPPDATA%\Programs\codebase-memory-mcp\codebase-memory-mcp.exe" (
    set "CBM_EXE=%LOCALAPPDATA%\Programs\codebase-memory-mcp\codebase-memory-mcp.exe"
) else (
    for /f "delims=" %%I in ('where codebase-memory-mcp.exe 2^>nul') do if not defined CBM_EXE set "CBM_EXE=%%I"
    if not defined CBM_EXE (
        for /f "delims=" %%I in ('where codebase-memory-mcp 2^>nul') do if not defined CBM_EXE set "CBM_EXE=%%I"
    )
)

set "CRG_EXE="
for /f "delims=" %%I in ('where code-review-graph.exe 2^>nul') do if not defined CRG_EXE set "CRG_EXE=%%I"
if not defined CRG_EXE (
    for /f "delims=" %%I in ('where code-review-graph 2^>nul') do if not defined CRG_EXE set "CRG_EXE=%%I"
)

if defined CBM_EXE (
    set "CBM_STATUS=FOUND"
) else (
    set "CBM_STATUS=NOT FOUND"
)

if defined CRG_EXE (
    set "CRG_STATUS=FOUND"
) else (
    set "CRG_STATUS=NOT FOUND"
)

echo ===================================================
echo        CBM + CRG GRAPH SYNC MANAGER
echo ===================================================
echo.
echo Project : %REPO_ROOT%
echo.
echo CBM : %CBM_STATUS%
echo CRG : %CRG_STATUS%
echo.
echo [1] Quick Sync Both Graphs (Incremental)
echo [2] Check Status of Both Graphs
echo [3] Full Rebuild Both Graphs
echo [4] Sync CBM Only
echo [5] Sync CRG Only
echo [6] Launch CBM Visualizer
echo [7] Launch CRG Interactive Graph
echo [8] Exit
echo.

set /p "CHOICE=Select an option [1-8]: "

if "%CHOICE%"=="1" goto QUICK_SYNC
if "%CHOICE%"=="2" goto CHECK_STATUS
if "%CHOICE%"=="3" goto FULL_REBUILD
if "%CHOICE%"=="4" goto SYNC_CBM
if "%CHOICE%"=="5" goto SYNC_CRG
if "%CHOICE%"=="6" goto LAUNCH_CBM_UI
if "%CHOICE%"=="7" goto LAUNCH_CRG_UI
if "%CHOICE%"=="8" goto EXIT_SCRIPT

echo [WARN] Invalid choice. Please select 1-8.
pause
goto MENU

:QUICK_SYNC
echo.
echo ===================================================
echo [1/2] Updating CBM AST Knowledge Graph...
if defined CBM_EXE (
    "%CBM_EXE%" index_repository
    if !ERRORLEVEL! EQU 0 (
        echo [OK] CBM graph updated successfully.
    ) else (
        echo [ERROR] CBM sync failed with code !ERRORLEVEL!.
    )
) else (
    echo [SKIP] CBM : NOT FOUND
)

echo.
echo [2/2] Updating CRG Blast Radius Graph...
if defined CRG_EXE (
    "%CRG_EXE%" update --brief
    if !ERRORLEVEL! EQU 0 (
        echo [OK] CRG graph updated successfully.
    ) else (
        echo [ERROR] CRG sync failed with code !ERRORLEVEL!.
    )
) else (
    echo [SKIP] CRG : NOT FOUND
)

echo.
echo ===================================================
echo SYNC COMPLETE
echo ===================================================
pause
goto MENU

:CHECK_STATUS
echo.
echo ===================================================
echo Checking CBM Status...
if defined CBM_EXE (
    "%CBM_EXE%" cli list_projects
) else (
    echo [SKIP] CBM : NOT FOUND
)

echo.
echo Checking CRG Status...
if defined CRG_EXE (
    "%CRG_EXE%" status
) else (
    echo [SKIP] CRG : NOT FOUND
)
echo ===================================================
pause
goto MENU

:FULL_REBUILD
echo.
echo ===================================================
echo WARNING:
echo This performs a full graph rebuild.
echo.
set /p "CONFIRM=Proceed? Y/N: "
if /i not "%CONFIRM%"=="Y" (
    echo [WARN] Rebuild aborted by user.
    pause
    goto MENU
)

echo.
echo Rebuilding CBM AST Knowledge Graph...
if defined CBM_EXE (
    "%CBM_EXE%" index_repository --force
    if !ERRORLEVEL! NEQ 0 (
        "%CBM_EXE%" index_repository
    )
    if !ERRORLEVEL! EQU 0 (
        echo [OK] CBM rebuild completed.
    ) else (
        echo [ERROR] CBM rebuild failed.
    )
) else (
    echo [SKIP] CBM : NOT FOUND
)

echo.
echo Rebuilding CRG Blast Radius Graph...
if defined CRG_EXE (
    "%CRG_EXE%" build
    if !ERRORLEVEL! EQU 0 (
        echo [OK] CRG rebuild completed.
    ) else (
        echo [ERROR] CRG rebuild failed.
    )
) else (
    echo [SKIP] CRG : NOT FOUND
)
echo ===================================================
pause
goto MENU

:SYNC_CBM
echo.
echo ===================================================
echo Synchronizing CBM AST Knowledge Graph...
if defined CBM_EXE (
    "%CBM_EXE%" index_repository
    if !ERRORLEVEL! EQU 0 (
        echo [OK] CBM graph updated successfully.
    ) else (
        echo [ERROR] CBM sync failed.
    )
) else (
    echo [SKIP] CBM : NOT FOUND
)
echo ===================================================
pause
goto MENU

:SYNC_CRG
echo.
echo ===================================================
echo Synchronizing CRG Blast Radius Graph...
if defined CRG_EXE (
    "%CRG_EXE%" update --brief
    if !ERRORLEVEL! EQU 0 (
        echo [OK] CRG graph updated successfully.
    ) else (
        echo [ERROR] CRG sync failed.
    )
) else (
    echo [SKIP] CRG : NOT FOUND
)
echo ===================================================
pause
goto MENU

:LAUNCH_CBM_UI
echo.
echo ===================================================
echo Launching CBM Visualizer...
if defined CBM_EXE (
    start "" "http://localhost:9749"
    "%CBM_EXE%" ui
) else (
    echo [SKIP] CBM : NOT FOUND
)
echo ===================================================
pause
goto MENU

:LAUNCH_CRG_UI
echo.
echo ===================================================
echo Launching CRG Interactive Graph...
if exist "%REPO_ROOT%\.code-review-graph\graph.html" (
    start "" "%REPO_ROOT%\.code-review-graph\graph.html"
    echo [OK] Opened %REPO_ROOT%\.code-review-graph\graph.html
) else if defined CRG_EXE (
    "%CRG_EXE%" view
    if exist "%REPO_ROOT%\.code-review-graph\graph.html" (
        start "" "%REPO_ROOT%\.code-review-graph\graph.html"
    )
) else (
    echo [SKIP] CRG graph file or executable not found.
)
echo ===================================================
pause
goto MENU

:EXIT_SCRIPT
exit /b 0
