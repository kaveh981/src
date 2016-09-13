#!/bin/sh

SRC=$(readlink -f $(dirname $0)/../src/)
HERE=$(readlink -f $(dirname $0))
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

cp -rf $TMP/build/* $DEST
cp -rf $SRC/config $DEST
cp -rf $SRC/locales $DEST
cp -rf $TMP/node_modules $DEST
cp -rf $SRC/schemas $DEST
cp -rf $SRC/.env $DEST

# Remove files from /tmp
rm -rf /tmp/*

# Deploy starth.sh to /bin
cp $HERE/start.sh /bin/