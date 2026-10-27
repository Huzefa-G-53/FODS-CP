@echo off
echo ====================================================
echo   PathForge Native Windows Runner
echo ====================================================

if not exist "server.exe" (
    echo [*] server.exe not found. Running compilation...
    gcc -Wall -Wextra -O2 -Ibackend backend/server.c backend/models.c backend/api.c backend/graph.c backend/hashmap.c backend/linked_list.c backend/queue.c backend/stack.c -lws2_32 -o server.exe
    if errorlevel 1 (
        echo [-] Compilation failed!
        pause
        exit /b 1
    )
)

echo [*] Launching PathForge HTTP Server on http://localhost:8000
echo [*] Press Ctrl+C to stop the server
server.exe --port 8000 --data data --frontend frontend
pause
