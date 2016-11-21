FROM ir.indexexchange.com:5000/nginx:1.10

ENV TZ America/Toronto

RUN mkdir /src
COPY . /src/

ARG ENVIRONMENT
ENV ENVIRONMENT ${ENVIRONMENT:-development}

RUN sh /src/bin/deploy.sh $ENVIRONMENT && \
    rm -rf /src

ENTRYPOINT ["nginx", "-g", "daemon off;"]

ARG DOCKERFILE_URL
ARG GIT_COMMIT
ARG DATE

LABEL  SERVICE_NAME=atw-nginx \
       DOCKERFILE_URL=${DOCKERFILE_URL:-dev} \
       GIT_COMMIT=${GIT_COMMIT:-dev} \
       DATE=${DATE:-dev} \
       ENVIRONMENT=$ENVIRONMENT
