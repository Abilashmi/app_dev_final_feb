FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

# Install ALL deps (including devDeps needed for build + prisma generate)
RUN npm ci && npm cache clean --force

COPY . .

# Generate Prisma client BEFORE building the app
RUN npx prisma generate

RUN npm run build

# Prune devDependencies after build (keep prisma generated client)
RUN npm prune --omit=dev

CMD ["node", "./dbsetup.js", "npm", "run", "start"]
