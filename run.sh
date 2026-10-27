#!/usr/bin/env bash
set -e

echo "===================================================="
echo "  PathForge C DSA HTTP Server (macOS / Linux Runner)"
echo "===================================================="

if [ ! -f "server" ]; then
    echo "[*] 'server' binary not found. Compiling..."
    gcc -Wall -Wextra -O2 -Ibackend \
        backend/server.c backend/models.c backend/api.c \
        backend/graph.c backend/hashmap.c backend/linked_list.c \
        backend/queue.c backend/stack.c \
        -lpthread -o server
    echo "[+] Server binary compiled successfully!"
fi

echo "[*] Launching PathForge HTTP Server on http://localhost:8000..."
echo "[*] Press Ctrl+C to stop the server."
./server --port 8000 --data data --frontend frontend
