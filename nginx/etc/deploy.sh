#!/bin/sh

ENV=${ENV:-production}

HERE=$(readlink -f $(dirname $0))
DEST=/etc/nginx

# Deploy config
rm -rf $DEST/*
cp -f $HERE/mime.types $DEST/mime.types
cp -rf $HERE/ssl $DEST/
cp -rf $HERE/$ENV/* $DEST/

# Deploy start script
cp -f $HERE/start.sh /bin/start.sh
