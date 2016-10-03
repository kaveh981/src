#!/bin/sh

ENV=${1:-development}

ENV=ENV sh /src/atwater.git/api/bin/deploy.sh
exec sh /bin/start.sh $ENV