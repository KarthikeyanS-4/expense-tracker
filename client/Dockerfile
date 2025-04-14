FROM node:22
 
WORKDIR /web
 
COPY /package*.json /web/
 
RUN npm install
 
COPY . /web/
 
RUN npm run build
 
EXPOSE 4173
 
CMD [ "npm", "run", "preview", "--", "--host" ]