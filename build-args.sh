#!/bin/sh

export TAG=${VERSION:-newest}

git fetch --all \
  && git checkout master \
  && git pull \
  && git checkout $TAG \
  || exit 10

export GIT_COMMIT=$(git rev-parse --short HEAD)
export DATE=`date +%Y-%m-%d`

