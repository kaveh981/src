#!/bin/sh

ENV=${ENV:-production}

sh /src/atwater.git/api/etc/deploy.sh
sh /src/atwater.git/api/etc/start.sh