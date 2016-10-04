FROM ir.indexexchange.com:5000/nginx:1.10

RUN mkdir /src
COPY . /src/

ARG env=development
ENV env $env

RUN sh /src/etc/deploy.sh $env
RUN rm -rf /src

#ENTRYPOINT ["sh", "/bin/start.sh", "$env"]
ENTRYPOINT ["nginx", "-g", "\"daemon off;\""]

ARG GIT_COMMIT=dev
ARG DATE=dev

LABEL  SERVICE_NAME=atw-nginx \
       GIT_COMMIT=${GIT_COMMIT} \
       DATE=${DATE}
