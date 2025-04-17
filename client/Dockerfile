FROM node:22-alpine

ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL

WORKDIR /client

COPY package*.json ./
RUN npm ci --legacy-peer-deps --quiet

COPY . .

RUN npm run build

EXPOSE 4173

CMD [ "npm", "run", "preview", "--", "--host" ]