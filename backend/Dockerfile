FROM oven/bun:1.1.30
WORKDIR /app
COPY package.json tsconfig.json ./
RUN bun install
COPY src ./src
EXPOSE 3001
CMD ["bun", "run", "start"]
