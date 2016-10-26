FROM ir.indexexchange.com:5000/nginx:1.10

ENV TZ America/Toronto

RUN mkdir /src
COPY . /src/

ARG env=development
ENV env $env

RUN sh /src/bin/deploy.sh $env
RUN rm -rf /src

ENTRYPOINT ["nginx", "-g", "daemon off;"]

ARG GIT_COMMIT=dev
ARG DATE=dev

LABEL  SERVICE_NAME=atw-nginx \
       GIT_COMMIT=${GIT_COMMIT} \
       DATE=${DATE}
