#!/bin/sh

ENV=${1:-development}

SRC=$(readlink -f $(dirname $0)/../etc/$ENV)
DEST=/etc/nginx

# Deploy config
echo "Deploying Nginx in $ENV environment..."
rm -rf $DEST/*
cd $SRC
cp -rf $SRC/* $DEST
