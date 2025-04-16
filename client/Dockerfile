FROM node:22
 
WORKDIR /client
 
COPY /package*.json /client/
 
RUN npm install
 
COPY . /web/
 
RUN npm run build
 
EXPOSE 4173
 
CMD [ "npm", "run", "preview", "--", "--host" ]