FROM ir.indexexchange.com:5000/node:6.9
RUN mkdir -p /opt/atwater/api

# Define ENTRYPOINT for image
ENTRYPOINT ["entrypoint-api.sh"]

# Load build-args
ARG ENVIRONMENT
ARG DOCKERFILE_URL
ARG GIT_COMMIT
ARG DATE

# Container TimeZone to EST/EDT
ENV TZ America/Toronto
# SRC_DIR - Path to source code
ENV SRC_DIR /src
# BASEDIR - Base path for services in Atwater
ENV BASE_DIR /opt/atwater
# DESTDIR - Path where service is deployed
ENV DEST_DIR $BASE_DIR/api
# ENVIRONMENT - defaults to "development" if build-arg wasn't provided
ENV ENVIRONMENT ${ENVIRONMENT:-development}
# NODE_ENV for npm and other nodejs processes
ENV NODE_ENV $ENVIRONMENT

# Label image
LABEL  SERVICE_NAME=atw-api \
    DOCKERFILE_URL=${DOCKERFILE_URL:-dev} \
    GIT_COMMIT=${GIT_COMMIT:-dev} \
    DATE=${DATE:-dev} \
    ENVIRONMENT=$ENVIRONMENT

# Install OS dependencies with apt
RUN apt update && apt install logrotate sendmail -y

# Copy entrypoint-api.sh to /bin and add execution permissions
COPY docker/entrypoint-api.sh /bin/entrypoint-api.sh
RUN chmod +x /bin/entrypoint-api.sh

# Copy Build Context to $SRC_DIR
COPY ./ $SRC_DIR

# Run entrypoint in "deploy" mode, then remove $SRC_DIR
RUN entrypoint-api.sh --deploy && \
    rm -rf $SRC_DIR
