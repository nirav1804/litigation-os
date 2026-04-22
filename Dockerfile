FROM node:20-alpine

WORKDIR /app

# ✅ ADD THIS LINE
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 10000

CMD ["node", "dist/src/main.js"]
