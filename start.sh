#!/bin/bash

export PATH="/opt/homebrew/bin:$PATH"

echo "Starting Python server..."
cd /Users/estarguan/Developer/Github/JamHacks/backend && python3 server.py &
PYTHON_PID=$!

echo "Starting analyze server..."
cd /Users/estarguan/Developer/Github/JamHacks/backend && node analyzeServer.js &
NODE_PID=$!

echo "Starting keyword listener..."
cd /Users/estarguan/Developer/Github/JamHacks/backend/normal_mode && node monitorKeywords.js &
KEYWORD_PID=$!

echo "Starting web dashboard..."
cd /Users/estarguan/Developer/Github/JamHacks/web_sense && npm run dev &
VITE_PID=$!

echo "All servers running. Press Ctrl+C to stop everything."

trap "kill $PYTHON_PID $NODE_PID $KEYWORD_PID $VITE_PID 2>/dev/null; echo 'Stopped.'" SIGINT SIGTERM
wait
