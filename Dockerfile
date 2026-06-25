FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN cd backend && npm install
RUN cd frontend && npm install

RUN cd frontend && npm run build

ENV NODE_ENV=production
ENV PORT=7860

EXPOSE 7860

CMD ["node", "server.js"]