#!/bin/sh
set -x
set -e

MODE=${1:-run}

# Existence of SRC_DIR means environment is first time build, or workstation-development deployment
if [ -d $SRC_DIR ]; then
    echo "Deploying atw-api in $ENVIRONMENT environment"
    # Clean
    rm -rf $DEST_DIR/src $DEST_DIR/config $DEST_DIR/locals $DEST_DIR/node_modules
    rm -rf $SRC_DIR/build

    # Npm install and Compile TS to JS
    cd $SRC_DIR
    echo "Installing npm dependencies"
    npm install -s && npm run postinstall
    echo "Compiling TS to JS"
    node_modules/.bin/tsc
    
    # Deploy build/ && config/ && locales/ && node_modules/ && src/schemas/
    echo "Deploying to $DEST_DIR"
    cp -rf $SRC_DIR/build/* $DEST_DIR
    cp -rf $SRC_DIR/config $DEST_DIR
    cp -rf $SRC_DIR/node_modules $DEST_DIR
    cp -rf $SRC_DIR/package.json $DEST_DIR
    cp -rf $SRC_DIR/spec $DEST_DIR

    # Deploy secrets if found. Won't be found during image building, but will be found in workstation deployments when
    # the /src/ dir is mounted to the container (development).
    test -e $SRC_DIR/.env \
    && echo "Copying .env from $SRC_DIR (workstation development deployment)" \
    && cp -rf $SRC_DIR/.env $DEST_DIR \
    || echo "Not deploying any secrets (build-time deployment).."

fi

test "$MODE" != "--deploy" \
    && cd $DEST_DIR \
    && exec node src/index.js \
    || exit 0
