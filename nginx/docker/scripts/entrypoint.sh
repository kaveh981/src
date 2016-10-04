#!/bin/sh

ENV=${1:-development}

sh /src/etc/deploy.sh $ENV
exec sh /bin/start.sh