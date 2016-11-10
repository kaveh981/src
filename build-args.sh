#!/bin/sh

APIVERSION=${1:-latest}
NGINXVERSION=${2:-latest}

export APIVERSION=:$APIVERSION
export NGINXVERSION=:$NGINXVERSION
export ENVIRONMENT=${ENVIRONMENT:-production}
export GIT_COMMIT=$(git rev-parse --short HEAD)
export DATE=`date +%Y-%m-%d`
