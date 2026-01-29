# Use Node.js 20-slim as requested by the project structure
FROM node:20-slim

WORKDIR /app

# Install dependencies
# Using package.json which includes the 'mint' CLI (Mintlify)
COPY package.json ./
RUN npm install

# Copy the documentation files
COPY . .

# Expose the port Mintlify uses (default 3000)
EXPOSE 3000

# Start the Mintlify development server
CMD ["npm", "run", "dev"]
