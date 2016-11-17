#!/bin/sh

export ATW_APIVER=:$APIVER
export ATW_NGINXVER=:$NGINXVER
export ATW_GIT_COMMIT=$(git rev-parse --short HEAD)
export ATW_DATE=`date +%Y-%m-%d`
