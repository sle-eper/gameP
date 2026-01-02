FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build the project
RUN npm run build

# Use a lightweight server for production
RUN npm install -g http-server@0.12.3 --no-audit --no-fund --silent

EXPOSE 8080

# Serve the dist directory on port 8080
CMD ["http-server", "/app/dist", "-p", "8080", "-c-1"]
