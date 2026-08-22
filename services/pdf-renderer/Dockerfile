FROM ghcr.io/puppeteer/puppeteer:25.8.0@sha256:f3a51ec3cf472044c99c8c48ab9b850ac94652ac541966205985d1afa2c794e8

USER root
WORKDIR /app
# Chrome still needs writable config/cache storage for Crashpad even when its
# profile lives under /tmp. The runtime root filesystem is read-only, while
# docker-compose.pdf.yml provides /tmp as a bounded writable tmpfs.
ENV NODE_ENV=production \
  PUPPETEER_SKIP_DOWNLOAD=true \
  XDG_CONFIG_HOME=/tmp/.chromium \
  XDG_CACHE_HOME=/tmp/.chromium

# Pull Debian security fixes released after the base image was built —
# the Trivy CI gate fails on any fixable Critical/High CVE in the image.
RUN apt-get update \
  && apt-get full-upgrade -y --no-install-recommends \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
  && rm -rf \
    /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /home/pptruser/.npm \
    /root/.npm

COPY server.mjs ./
USER pptruser

EXPOSE 8080
CMD ["node", "server.mjs"]
