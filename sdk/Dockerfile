FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY src/ ./src/
COPY example.js ./

# Read INGESTION_URL from environment — defaults to ingestion-api service name
ENV INGESTION_URL=http://ingestion-api:4000

CMD ["node", "example.js"]