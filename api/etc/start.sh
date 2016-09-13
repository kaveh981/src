#!/bin/sh

pid=0
export NODE_ENV=${1:-production}

cd /opt/atwater/

# SIGTERM-handler
sigterm_handler() {
  if [ $pid -ne 0 ]; then
    echo "Sending SIGTERM to node process"
    kill -15 "$pid"
    wait "$pid"
  fi
  exit 0
}
# setup handlers
# on callback, kill the last background process, which is `tail -f /dev/null` and execute the specified handler
trap 'sigterm_handler' SIGTERM

# start api
node index.js &
pid="$!"

# wait forever so that container doesn't exit after spawning the processes
while true
do
  wait "$pid"
  echo "Node process exited on its own, stopping container"
  exit 10
done