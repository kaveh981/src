#!/bin/sh
# Below configuration properties such as name and type.
# These can be overridden: "TYPE=deployed sh build.sh"
REPO=ir.indexexchange.com:5000
VERSION=${VERSION-"newest"}
TYPE=${TYPE-"core"}
SERVICE_NAME=${NAME-"api"}
GIT_COMMIT=$(git rev-parse --short HEAD)
DATE=`date +%Y-%m-%d`

#this defines the build context directory,
#BUILD_CONTEXT=/src

# Test for any BUILD_CONTEXT built from this script's location [ SEEMS TO WORK ! ! ! ]
HERE=$(readlink -f $(dirname $0))
BUILD_CONTEXT=$(readlink -f $HERE/../../../..)
echo "Build context set to: $BUILD_CONTEXT"

# Below is the config for setting the build context
SERVICE_PATH=$BUILD_CONTEXT/atwater.git/api
DOCKERFILE_PATH=$SERVICE_PATH/docker/Dockerfile.$TYPE

# this is a hack to ensure .dockerignore file gets used
# in the future it will be possible to specificy the .dockerignore file as part of the build command
cp -f $SERVICE_PATH/docker/.dockerignore $BUILD_CONTEXT/.dockerignore

# this is the actual build command using Docker's CLI
echo "Building $REPO/$SERVICE_NAME.$TYPE:$VERSION"
docker build -t $REPO/$SERVICE_NAME.$TYPE:$VERSION \
             -f $DOCKERFILE_PATH                   \
             --build-arg GIT_COMMIT=$GIT_COMMIT    \
             --build-arg DATE=$DATE                \
             $BUILD_CONTEXT
# clean up dockerignore hack
rm -f $BUILD_CONTEXT/.dockerignore