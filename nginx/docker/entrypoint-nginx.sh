#!/bin/sh
set -x
set -e

# Test if src exists, meaning it's workstation.yaml deployment, and deploy
test -d $SRC_ETC && \
    echo "Deploying nginx configurations in $ENVIRONMENT environment" && \
    rm -rf $DEST_ETC/* && \
    cp -rf $SRC_ETC/* $DEST_ETC

# Start the nginx server
echo "`date` - Nginx starting..."
exec nginx -g "daemon off;"