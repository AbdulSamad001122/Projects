#!/bin/bash
echo "Starting build process..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build Next.js application
echo "Building Next.js application..."
npx next build

echo "Build process completed!"