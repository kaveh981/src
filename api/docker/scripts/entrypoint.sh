#!/bin/sh

ENV=${ENV:-production}

ENV=ENV sh /src/atwater.git/api/bin/deploy.sh
exec sh /bin/start.sh $ENV