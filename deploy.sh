#!/bin/bash
set -e

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Setting up Backend..."
cd Backend

echo "📦 Installing dependencies..."
npm install

echo "🛠 Syncing Prisma schema (SAFE)..."
npx prisma db push

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🏗 Building Backend..."
npm run build

echo "📦 Setting up Admin..."
cd ../Admin

echo "📦 Installing dependencies..."
npm install

echo "🏗 Building Admin..."
npm run build

echo "📦 Setting up Frontend..."
cd ../Frontend

echo "📦 Installing dependencies..."
npm install

echo "🏗 Building Frontend..."
npm run build

echo "🚚 Deploying Frontend to Nginx..."
cp -r dist/* /var/www/html/

echo "🔄 Restarting PM2..."
pm2 restart all

echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo "✅ Deploy complete 🚀"
