#!/bin/sh

HERE=$(readlink -f $(dirname $0))
SRC=$HERE/..
DEST=/opt/atwater/
TMP=/tmp/atwater

# Compile TS to JS
rm -rf /tmp/*
mkdir -p $TMP

cd $SRC && cp -rf ./* $TMP && cd $TMP
npm install && npm run postinstall
node_modules/typescript/bin/tsc

# Deploy build/ && config/ && locales/ && node_modules/ && schemas/ && .env
rm -rf /opt/*
mkdir -p $DEST

cp -rf $TMP/build/src/* $DEST
cp -rf $SRC/src/config $DEST
cp -rf $SRC/src/schemas $DEST
cp -rf $TMP/node_modules $DEST
cp -rf $SRC/.env $DEST
cp -rf $SRC/package.json $DEST

# Remove files from /tmp
rm -rf /tmp/*

# Copy starth.sh to /bin
cp $HERE/start.sh /bin/