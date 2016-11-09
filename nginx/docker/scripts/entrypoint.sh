#!/bin/sh

ENV=${1:-development}

sh /src/bin/deploy.sh $ENV
exec nginx -g "daemon off;"