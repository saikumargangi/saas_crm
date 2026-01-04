# Optimized frontend Dockerfile with dependency caching

FROM node:20-alpine AS base

WORKDIR /app

# ============================================
# Dependencies stage (heavily cached)
# ============================================
FROM base AS deps

# Copy package files ONLY (cached unless these change)
COPY package.json package-lock.json* ./

# Install dependencies with caching
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ============================================
# Development stage
# ============================================
FROM base AS development

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start dev server
CMD ["npm", "run", "dev"]
