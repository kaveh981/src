FROM ir.indexexchange.com:5000/nginx:1.10

# Define image entrypoint
ENTRYPOINT ["entrypoint-nginx.sh"]

# Load build-args
ARG ENVIRONMENT
ARG DOCKERFILE_URL
ARG GIT_COMMIT
ARG DATE

# Container TimeZone to EST/EDT
ENV TZ America/Toronto
# ENVIRONMENT - defaults to "development" if build-arg wasn't provided
ENV ENVIRONMENT ${ENVIRONMENT:-development}
# SRC_ETC - src path for nginx configurations
ENV SRC_ETC /etc/${ENVIRONMENT:-development}
# DEST_ETC - destination path for nginx configurations
ENV DEST_ETC /etc/nginx

# Label the image
LABEL  SERVICE_NAME=atw-nginx \
       DOCKERFILE_URL=${DOCKERFILE_URL:-dev} \
       GIT_COMMIT=${GIT_COMMIT:-dev} \
       DATE=${DATE:-dev} \
       ENVIRONMENT=$ENVIRONMENT

# Copy entrypoint-api.sh to /bin and add execution permissions
COPY docker/entrypoint-nginx.sh /bin/entrypoint-nginx.sh
RUN chmod +x /bin/entrypoint-nginx.sh

# Deploy config
ADD ["$SRC_ETC", "$DEST_ETC"]
