#!/bin/sh

VERSION=${VERSION:-latest}

export VERSION=:$VERSION
export ENVIRONMENT=${ENVIRONMENT:-production}
export GIT_COMMIT=$(git rev-parse --short HEAD)
export DATE=`date +%Y-%m-%d`
