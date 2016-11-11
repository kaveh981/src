FROM ir.indexexchange.com:5000/nginx:1.10

ENV TZ America/Toronto

RUN mkdir /src
COPY . /src/

ARG ENVIRONMENT
ENV ENVIRONMENT ${ENVIRONMENT:-development}

RUN sh /src/bin/deploy.sh $ENVIRONMENT && \
    rm -rf /src

ENTRYPOINT ["nginx", "-g", "daemon off;"]

ARG GIT_COMMIT
ARG DATE

LABEL  SERVICE_NAME=atw-nginx \
       GIT_COMMIT=${GIT_COMMIT:-dev} \
       DATE=${DATE:-dev} \
       ENVIRONMENT=$ENVIRONMENT
