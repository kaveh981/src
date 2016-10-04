#!/bin/sh

ENV=${1:-development}
echo "Deploying atw-api in $ENV environment"

HERE=$(readlink -f $(dirname $0))
SRC=$HERE/..
DEST=/opt/atw-api/
TMP=/tmp/atw-api

# Compile TS to JS
rm -rf $TMP
mkdir -p $TMP

# Copy to /tmp/atw-api
echo "Copying $SRC/* to $TMP"
cd $SRC && cp -rf ./* $TMP && rm -rf $TMP/build

# Npm install and Compile TS to JS
echo "Installing npm dependencies"
cd $TMP && npm install && npm run postinstall
echo "Compiling TS to JS"
node_modules/typescript/bin/tsc

# Clean /opt/atw-git
rm -rf $DEST/*
# Deploy build/ && config/ && locales/ && node_modules/ && schemas/ && .env
echo "Deploying build to $DEST"
cp -rf $TMP/build/src $DEST
cp -rf $SRC/config $DEST
cp -rf $SRC/src/schemas $DEST/src
cp -rf $TMP/node_modules $DEST
cp -rf $SRC/.env $DEST
cp -rf $SRC/package.json $DEST

# Remove files from /tmp
rm -rf /tmp/*

# Copy starth.sh to /bin
echo "Copying start.sh to /bin"
cp $HERE/start.sh /bin/