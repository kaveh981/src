#!/bin/sh

TAG=${VERSION:-newest}

git fetch --all \
  && git checkout master \
  && git pull \
  && git checkout $TAG \
  || exit 10

GIT_COMMIT=$(git rev-parse --short HEAD)
DATE=`date +%Y-%m-%d`

