@echo off
REM ---------------------------------------------------------------
REM  moopet dev launcher  --  ASCII ONLY
REM  (cmd.exe reads .cmd files in the ANSI codepage, so non-ASCII
REM   characters here corrupt the parser. Do not add Persian text.)
REM
REM  Laragon's Node v18 wins in PATH, but Astro 7 needs >= 22.12.
REM  fnm only hooks into PowerShell, so from cmd.exe we call it
REM  explicitly via `fnm exec`.
REM
REM  Usage:
REM    dev.cmd        ->  web  (Astro)   http://localhost:4321
REM    dev.cmd api    ->  api  (NestJS)  http://localhost:3000/api
REM ---------------------------------------------------------------

cd /d "%~dp0"

where fnm >nul 2>&1
if errorlevel 1 (
  echo [moopet] ERROR: fnm not found in PATH.
  echo [moopet] Open a NEW terminal, or reinstall: winget install Schniz.fnm
  exit /b 1
)

if /i "%~1"=="api" (
  echo [moopet] starting API on Node 22 ...
  fnm exec --using=22 -- npm.cmd run dev:api
) else (
  echo [moopet] starting WEB on Node 22 ...
  fnm exec --using=22 -- npm.cmd run dev
)
