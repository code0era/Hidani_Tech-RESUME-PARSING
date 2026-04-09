FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# Run the Vite development server mapped to exactly 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host"]
