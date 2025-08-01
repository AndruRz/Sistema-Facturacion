@echo off
title Sistema de Facturion
cls

echo ===============================================
echo      INICIANDO SERVIDOR
echo ===============================================
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no está instalado o no está en el PATH
    echo Por favor instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

REM Verificar si existe package.json
if not exist package.json (
    echo ERROR: No se encontró package.json en este directorio
    echo Asegúrate de estar en la carpeta raíz de tu proyecto
    pause
    exit /b 1
)

REM Instalar dependencias si no existen
if not exist node_modules (
    echo Instalando dependencias...
    npm install
    echo.
)

echo Iniciando servidor...
echo.
echo ===============================================
echo   SERVIDOR ACTIVO - URLs DISPONIBLES:
echo ===============================================

REM Ejecutar el servidor
node server.js

REM Si el servidor se cierra, mantener la ventana abierta
echo.
echo ===============================================
echo El servidor se ha detenido.
echo Presiona cualquier tecla para cerrar...
pause >nul