#!/bin/sh

TAG=${VERSION:-newest}

git fetch origin --all && git reset --hard HEAD && git pull && git checkout $TAG

GIT_COMMIT=$(git rev-parse --short HEAD)
DATE=`date +%Y-%m-%d`

