#!/bin/sh

TAG=${VERSION:-newest}

git fetch --all \
  && git reset --hard origin/$(parse_git_branch) \
  && git pull \
  && git checkout master \
  && git pull \
  && git checkout $TAG \
  && git pull \
  || exit 10

GIT_COMMIT=$(git rev-parse --short HEAD)
DATE=`date +%Y-%m-%d`

