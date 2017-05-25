FROM node:alpine
MAINTAINER Yuhang Ge
COPY package.json /opt/git-hook/package.json
COPY ./src /opt/git-hook/src
COPY ./tasks /opt/git-hook/tasks

WORKDIR /opt/git-hook
RUN npm install
EXPOSE 3001
CMD ["npm", "start"]

