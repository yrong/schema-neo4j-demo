FROM node:8-alpine
RUN mkdir -p /src
COPY build /src
ENV LOG_PATH /logs
ENV RUNTIME_PATH /runtime
ENV NODE_CONFIG_DIR /config
ENV LICENSE_PATH /license
ENV NODE_ENV production
ENV NODE_NAME cmdb
WORKDIR /src
CMD ["node", "server.js"]