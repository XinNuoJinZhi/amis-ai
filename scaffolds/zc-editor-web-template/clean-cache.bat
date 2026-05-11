@echo off
echo Cleaning all cache directories...
echo.

echo [1/5] Cleaning .umi directory...
if exist .umi (
    rd /s /q .umi
    echo - .umi cleaned
) else (
    echo - .umi not found
)

echo [2/5] Cleaning .mako directory...
if exist .mako (
    rd /s /q .mako
    echo - .mako cleaned
) else (
    echo - .mako not found
)

echo [3/5] Cleaning src\.umi directory...
if exist src\.umi (
    rd /s /q src\.umi
    echo - src\.umi cleaned
) else (
    echo - src\.umi not found
)

echo [4/5] Cleaning node_modules\.cache directory...
if exist node_modules\.cache (
    rd /s /q node_modules\.cache
    echo - node_modules\.cache cleaned
) else (
    echo - node_modules\.cache not found
)

echo [5/5] Cleaning node_modules\.mfsu directory...
if exist node_modules\.mfsu (
    rd /s /q node_modules\.mfsu
    echo - node_modules\.mfsu cleaned
) else (
    echo - node_modules\.mfsu not found
)

echo.
echo ========================================
echo All cache directories have been cleaned!
echo ========================================
echo.
echo Next steps:
echo 1. Run: pnpm react
echo 2. Wait for compilation to complete
echo.
pause
