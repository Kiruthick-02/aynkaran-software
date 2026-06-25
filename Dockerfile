FROM node:20

WORKDIR /app

COPY . .

RUN cd backend && npm install
RUN cd frontend && npm install

RUN cd frontend && npm run build

EXPOSE 7860

ENV NODE_ENV=production
ENV PORT=7860

CMD ["node", "server.js"]