FROM node:22-alpine AS builder

WORKDIR /app

# Instal dependencies
COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN  npm run build

# Stage 2: Production stage with NGINX
FROM nginx:alpine AS prod

# Copy built files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom NGINX config (set to listen on 5173)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 5173 (matching your app's port)
EXPOSE 5173

# Start NGINX in foreground
CMD ["nginx", "-g", "daemon off;"]

# Production image
#FROM node:22-alpine AS prod

#WORKDIR /app

#RUN npm install -g serve

#COPY --from=builder /app/dist ./dist
#COPY --from=builder /app/package*.json ./


# Install production dependencies
#RUN npm ci --only=production

#ENV NODE_ENV=production
#EXPOSE 5173

#CMD ["npm", "start"]