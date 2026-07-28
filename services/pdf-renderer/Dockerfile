FROM ghcr.io/puppeteer/puppeteer:24.16.0@sha256:6dea48646fa972c9705281ff469922e6d10e6a6c9d3426a101fd824b6261e51b

USER root
WORKDIR /app
ENV NODE_ENV=production PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server.mjs ./
USER pptruser

EXPOSE 8080
CMD ["npm", "start"]
