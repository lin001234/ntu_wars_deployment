# Stage 1: Dependency install (with devDependencies)
FROM node:22-alpine AS prod

#Create and set working dir
WORKDIR /app

#Only install dependencies(for cicd,similar to npm install)
COPY package*json ./
RUN npm ci --only=production

#Copy rest of code
COPY . .

# Set environment to production to enable optimization and skip devDependencies
ENV NODE_ENV=production
#Expose ports (Express+socket.io)
EXPOSE 3000

#Start server
CMD ["npm","start"]