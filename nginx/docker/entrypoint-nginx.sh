#!/bin/sh
set -x
set -e

export SRC_ETC=/src/$SRC_ETC
# Test if src exists, meaning it's workstation.yaml deployment, and deploy
test -d $SRC_ETC && \
    echo "Deploying nginx configurations in $ENVIRONMENT environment" && \
    rm -rf $DEST_ETC/conf.d $DEST_ETC/nginx.conf && \
    cp -rf $SRC_ETC/conf.d $SRC_ETC/nginx.conf $DEST_ETC

# Start the nginx server
echo "`date` - Nginx starting..."
exec nginx -g "daemon off;"