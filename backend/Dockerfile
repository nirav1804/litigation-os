# ---------- Base ----------
FROM node:20-alpine
WORKDIR /app

# ---------- Install dependencies ----------
COPY package*.json ./
RUN npm ci

# ---------- Copy code ----------
COPY . .

# ---------- Build app ----------
RUN npx prisma generate
RUN npm run build

# ---------- Expose port ----------
EXPOSE 10000

# ---------- Start app ----------
CMD ["node", "dist/main.js"]
