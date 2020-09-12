FROM node:8.6.0

ADD . /usr/src/app

WORKDIR /usr/src/app

RUN npm set progress=false

RUN npm i

CMD ["npm", "run", "live"]