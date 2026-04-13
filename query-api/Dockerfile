FROM node:20-alpine

WORKDIR /app

# Copy package files first — Docker caches this layer
# so npm install only reruns when package.json changes
COPY package*.json ./
RUN npm install --only=production

# Copy source code
COPY src/ ./src/

EXPOSE 4000

CMD ["node", "src/index.js"]