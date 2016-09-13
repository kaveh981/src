#!/bin/sh

ENV=${ENV:-development}

ENV=$ENV sh /src/atwater.git/nginx/etc/deploy.sh
exec sh /bin/start.sh