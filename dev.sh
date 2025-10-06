#!/bin/bash

# Get the script's directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "🚀 Starting ioBroker Widget Development Environment..."

# Check if dev-server is already set up
if [ ! -d ".dev-server/default" ]; then
    echo "⚠️  Dev-server not initialized. Please run 'npm run dev:setup' first!"
    exit 1
fi

# Kill any existing processes more thoroughly
echo "🧹 Cleaning up old processes..."
pkill -f "vite.*build.*watch" 2>/dev/null
pkill -f "dev-server" 2>/dev/null
pkill -f "node tasks" 2>/dev/null
sleep 2

echo "🏗️  Starting build watch..."
(cd src-widgets && npm run build -- --watch) &
BUILD_PID=$!

echo "🔄 Starting file sync with smart vis-2 reload..."
LAST_HASH=""
CHANGE_COUNT=0
while true; do
    # Clean and copy files
    rm -rf widgets/vis-2-widgets-deluxe/* 2>/dev/null
    cp -r src-widgets/build/* widgets/vis-2-widgets-deluxe/ 2>/dev/null
    rm -rf .dev-server/default/node_modules/iobroker.vis-2-widgets-deluxe/widgets/vis-2-widgets-deluxe/* 2>/dev/null
    cp -r widgets/vis-2-widgets-deluxe/* .dev-server/default/node_modules/iobroker.vis-2-widgets-deluxe/widgets/vis-2-widgets-deluxe/ 2>/dev/null

    # Check for changes using file hash instead of timestamp
    if [ -d "src-widgets/build/assets" ]; then
        CURRENT_HASH=$(find src-widgets/build/assets -name "HelloWorld*.js" -type f 2>/dev/null | head -1 | xargs basename 2>/dev/null)

        if [ "$CURRENT_HASH" != "$LAST_HASH" ] && [ ! -z "$CURRENT_HASH" ]; then
            if [ ! -z "$LAST_HASH" ]; then  # Skip first run
                CHANGE_COUNT=$((CHANGE_COUNT + 1))
                echo "🔄 Changes detected (#$CHANGE_COUNT), restarting vis-2..."
                (cd .dev-server/default && node node_modules/iobroker.js-controller/iobroker.js restart vis-2 >/dev/null 2>&1)
            fi
            LAST_HASH="$CURRENT_HASH"
        fi
    fi

    sleep 2
done &
SYNC_PID=$!

echo "🌐 Starting dev-server..."
dev-server run &
SERVER_PID=$!

# Give server time to start
sleep 3

echo ""
echo "✅ Development environment is running!"
echo "📍 Admin: http://localhost:20426"
echo "📍 vis-2: http://localhost:8082/vis-2-beta/"
echo ""
echo "ℹ️  vis-2 auto-restarts on widget changes"
echo "💡 Tip: Use Ctrl+Shift+R for hard refresh in browser"
echo ""
echo "Press Ctrl+C to stop all processes..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $BUILD_PID $SYNC_PID $SERVER_PID 2>/dev/null
    pkill -f "vite.*build.*watch" 2>/dev/null
    pkill -f "dev-server" 2>/dev/null
    echo "✅ All processes stopped"
    exit 0
}

# Trap signals
trap cleanup INT TERM

# Wait for any process to exit
wait $SERVER_PID
echo "⚠️  Dev-server stopped unexpectedly!"
cleanup