#!/bin/bash
set -e

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Building Backend..."
cd Backend && npm install && npm run build

echo "📦 Building Frontend..."
cd ../Frontend && npm install && npm run build

echo "🚚 Deploying Frontend to Nginx..."
cp -r dist/* /var/www/html/

echo "🔄 Reloading PM2..."
pm2 reload all

echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo "✅ Deploy complete 🚀"
