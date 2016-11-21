#!/bin/sh

GIT_TAG=${1:-master}
ATW_GITLAB_BASEURL="http://gitlab.internal.casalemedia.com/index-market/atwater/blob/$GIT_TAG"

# Hard-coded Api image version
export ATW_APIVER=:0.2.0
# Hard-coded Nginx image version
export ATW_NGINXVER=:0.2.0
# Api Dockerfile URL on gitlab
export ATW_API_DOCKERFILE_URL="$ATW_GITLAB_BASEURL/api/docker/Dockerfile"
# Dockerfile URL on gitlab
export ATW_NGINX_DOCKERFILE_URL="$ATW_GITLAB_BASEURL/nginx/docker/Dockerfile"
# Git Commit Short Hash used to build the image
export ATW_GIT_COMMIT=$(git rev-parse --short HEAD)
# Date image was built
export ATW_DATE=`date +%Y-%m-%d`
