#!/bin/sh

export NODE_ENV=${1:-production}

cd /opt/atwater/
exec npm start