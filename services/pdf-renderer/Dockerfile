FROM ghcr.io/puppeteer/puppeteer:25.14.0@sha256:ced0f7e1b416fafb4166f9f9d26109ea7bbd7cb04b8a38ae8c14b61f364c3d6f

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
