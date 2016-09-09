#!/bin/sh

ENV=${ENV:-production}

ENV=ENV sh /src/atwater.git/api/etc/deploy.sh
sh /bin/start.sh $ENV