#!/bin/sh

# Run database migrations
pnpm --filter lib db:migrate

# Start the tracking worker in the background
pnpm --filter worker start &
WORKER_PID=$!

# Start Next.js server
pnpm --filter web start &
WEB_PID=$!

# Function to handle shutdown
shutdown() {
    echo "Shutting down..."
    kill $WORKER_PID $WEB_PID
    wait $WORKER_PID $WEB_PID
    exit 0
}

# Trap SIGTERM and SIGINT
trap shutdown SIGTERM SIGINT

# Wait for both processes
wait $WORKER_PID $WEB_PID
