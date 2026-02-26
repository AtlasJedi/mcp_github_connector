FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY dist/ ./dist/

ENV NODE_ENV=production

ENTRYPOINT ["node", "dist/index.js"]
