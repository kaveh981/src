#!/bin/sh

ENV=${ENV:-production}

ENV=ENV sh /src/atwater.git/api/etc/deploy.sh
exec sh /bin/start.sh $ENV