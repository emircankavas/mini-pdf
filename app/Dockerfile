FROM ubuntu:latest
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
RUN bash /tmp/nodesource_setup.sh
RUN apt-get install -y nodejs
RUN apt-get install -y ghostscript
ADD app app
WORKDIR /app
RUN ls /app
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]