#!/bin/sh

SRC=$(readlink -f $(dirname $0)/../src/)
HERE=$(readlink -f $(dirname $0))
DEST=/opt/atwater/

# Deploy src/
rm -rf /opt/*
mkdir -p $DEST
cp -r $SRC/* $DEST
cp -r $SRC/.env $DEST
cp $HERE/start.sh /bin/

# Install dependencies
cd $DEST
npm install && npm run postinstall
