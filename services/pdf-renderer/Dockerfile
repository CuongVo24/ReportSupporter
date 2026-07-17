FROM ghcr.io/puppeteer/puppeteer:24.16.0

USER root
WORKDIR /app
ENV NODE_ENV=production PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.mjs ./
USER pptruser
EXPOSE 8080
CMD ["npm", "start"]
