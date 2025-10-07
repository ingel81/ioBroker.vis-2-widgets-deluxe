#!/bin/bash

# Simple development script for vis-2 widgets
# No HMR - Module Federation doesn't support it
# Workflow: Edit → Auto-build → Browser refresh

# Get project root (parent of scripts directory)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "🚀 Starting vis-2 Widget Development Environment"
echo ""

# Check dev-server setup
if [ ! -d ".dev-server/default" ]; then
    echo "⚠️  Dev-server not initialized. Running setup..."
    dev-server setup
fi

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping..."
    kill $BUILD_PID $SERVER_PID $COPY_PID 2>/dev/null
    exit 0
}
trap cleanup INT TERM

# Start dev-server
echo "🌐 Starting ioBroker dev-server..."
dev-server watch --noStart &
SERVER_PID=$!
sleep 3

# Start build watch in src-widgets
echo "⚡ Starting Vite build watch..."
cd src-widgets
npm run build:watch &
BUILD_PID=$!
cd ..
sleep 1

# Start watch-and-copy
echo "📂 Starting file sync..."
node scripts/watch-and-copy.js &
COPY_PID=$!
sleep 1

echo ""
echo "✅ Development environment running!"
echo ""
echo "📍 Admin: http://localhost:8082/admin"
echo "📍 vis-2: http://localhost:8082/vis-2-beta/"
echo ""
echo "💡 Workflow:"
echo "   1. Edit widget files in src-widgets/src/"
echo "   2. Vite rebuilds automatically (~2s)"
echo "   3. vis-2 restarts automatically (watch console)"
echo "   4. Wait ~20 seconds for vis-2 to fully restart"
echo "   5. Refresh browser (F5) to see changes"
echo ""
echo "⚠️  Important: Wait ~20s after 'vis-2 restarted' before refreshing!"
echo "   vis-2 needs time to fully restart and reload widgets."
echo ""
echo "Press Ctrl+C to stop"

# Wait
wait $SERVER_PID $BUILD_PID $COPY_PID
cleanup
