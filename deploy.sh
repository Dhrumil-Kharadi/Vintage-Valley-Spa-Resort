#!/bin/bash

echo "Pulling latest code..."
git pull origin main

echo "Building Backend..."
cd Backend
npm install
npm run build

echo "Building Frontend..."
cd ../Frontend
npm install
npm run build

echo "Restarting PM2..."
pm2 reload all

echo "Deploy finished 🚀"
