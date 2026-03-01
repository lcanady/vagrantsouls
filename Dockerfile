FROM denoland/deno:2.0.0

WORKDIR /app

# Cache dependencies first (layer caching)
COPY deno.json deno.lock ./
RUN deno install

# Copy source and cache entry point
COPY . .
RUN deno cache server/main.ts

EXPOSE 4200

CMD ["deno", "run", "--allow-all", "--unstable-kv", "server/main.ts"]
