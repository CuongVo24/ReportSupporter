FROM ghcr.io/puppeteer/puppeteer:25.3.0@sha256:9665f5b57abc5cc7080a641878964018de219055a4d2c9d8d050ceb1161778ba

USER root
WORKDIR /app
ENV NODE_ENV=production PUPPETEER_SKIP_DOWNLOAD=true

# Pull Debian security fixes released after the base image was built —
# the Trivy CI gate fails on any fixable Critical/High CVE in the image.
RUN apt-get update \
  && apt-get full-upgrade -y --no-install-recommends \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server.mjs ./
USER pptruser

EXPOSE 8080
CMD ["npm", "start"]
