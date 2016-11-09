#!/bin/sh

ENV=${1:-development}

ENTRY=1 sh /src/bin/deploy.sh $ENV
exec nginx -g "daemon off;"