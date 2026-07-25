FROM ghcr.io/puppeteer/puppeteer:24.16.0@sha256:ad7de9f7e15ee32ce48daca4888616d23510949121f57e84ca64469fce2810e2

USER root
WORKDIR /app
ENV NODE_ENV=production PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server.mjs ./
USER pptruser

EXPOSE 8080
CMD ["npm", "start"]
