# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/build /usr/share/nginx/html

# Set API URL environment variable for production build
# This will be overridden by ARG during build if provided
ARG REACT_APP_API_URL=http://134.199.171.168:8080
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Create a simple nginx config that just serves the static files
RUN echo 'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    # Enable CORS headers\n\
    add_header "Access-Control-Allow-Origin" "*" always;\n\
    add_header "Access-Control-Allow-Methods" "GET, POST, OPTIONS, PUT, DELETE" always;\n\
    add_header "Access-Control-Allow-Headers" "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;\n\
    # Health check endpoint\n\
    location = /health {\n\
        access_log off;\n\
        return 200 "healthy\n";\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
