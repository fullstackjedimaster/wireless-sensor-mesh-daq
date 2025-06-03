#!/bin/bash

set -e

echo "🚀 Starting deployment prep for meshserver, dataserver, and portfolio..."

cd /opt/meshserver
echo "🐍 Creating venv for meshserver..."
python3.13 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi
deactivate

# === DATA SERVER SETUP ===
cd /opt/dataserver
echo "🐍 Creating venv for dataserver..."
python3.13 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi
deactivate

# === PORTFOLIO SITE SETUP ===
cd /opt/portfolio
echo "🧰 Installing portfolio dependencies..."
if [ -f package.json ]; then
  npm install
  npm run build
else
  echo "⚠️  package.json not found in /opt/portfolio — skipping."
fi

echo "✅ Deployment setup complete!"

echo ""
echo "📎 To run each app manually:"
echo "  cd /opt/meshserver && source .venv/bin/activate && python rundaq.py"
echo "  cd /opt/dataserver && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 5000"
echo "  cd /opt/portfolio && npm start (or use pm2)"
echo ""
echo "📌 You can also set up PM2 or systemd to keep these running long-term."
