#!/bin/sh
set -x
set -e

SRC_ETC=$SRC_DIR/etc/$ENVIRONMENT
DEST_ETC=/etc/nginx

# Test if src exists, meaning it's initial build deployment or workstation.yaml deployment, and deploy
test -d $SRC_ETC && \
    echo "Deploying nginx configurations in $ENVIRONMENT environment" && \
    rm -rf $DEST_ETC/conf.d $DEST_ETC/nginx.conf && \
    cp -rf $SRC_ETC/* $DEST_ETC

# Start the nginx server
echo "`date` - Nginx starting..."
exec nginx -g "daemon off;"