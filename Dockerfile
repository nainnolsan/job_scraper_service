# Use the official Microsoft Playwright image which includes browsers
FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3004

# Start command
CMD [ "npm", "start" ]
