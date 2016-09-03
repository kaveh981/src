#!/bin/sh

SRC=$(readlink -f $(dirname $0)/../src/)
DEST=/opt/atwater/

# Deploy src/
rm -rf /opt/*
mkdir -p $DEST
cp -r $SRC/* $DEST
cp -r $SRC/.env $DEST

# Install dependencies
cd $DEST
npm install
