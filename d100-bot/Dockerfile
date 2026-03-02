FROM denoland/deno:2.6.3

WORKDIR /app

# Cache dependencies first (layer caching)
COPY deno.json deno.lock ./
RUN deno install

# Copy source and cache entry point
COPY . .
RUN deno cache src/index.ts

CMD ["deno", "run", "--allow-all", "--unstable-kv", "src/index.ts"]
