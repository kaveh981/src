FROM ir.indexexchange.com:5000/node:6.9

ENV TZ America/Toronto

RUN mkdir /src && mkdir -p /opt/atw-api
COPY . /src

ARG ENVIRONMENT
ENV ENVIRONMENT ${ENVIRONMENT:-development}

RUN sh /src/bin/deploy.sh $ENVIRONMENT && \
    rm -rf /src

ENTRYPOINT ["sh", "-c", "/bin/start.sh $ENVIRONMENT"]

# Label img with Commit hash and date at build time
ARG DOCKERFILE_URL
ARG GIT_COMMIT
ARG DATE

LABEL  SERVICE_NAME=atw-api \
    DOCKERFILE_URL=${DOCKERFILE_URL:-dev} \
    GIT_COMMIT=${GIT_COMMIT:-dev} \
    DATE=${DATE:-dev} \
    ENVIRONMENT=$ENVIRONMENT