#!/bin/bash
# 前端部署脚本 - 在服务器上执行
# 用法: bash deploy.sh
set -e

ENV_FILE="/opt/deploy/deploy.env"
APP_DIR="/opt/yuAiGraph"
REPO_DIR="$APP_DIR/repo"

# ── 检查配置文件 ───────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 未找到配置文件 $ENV_FILE"
    exit 1
fi
source "$ENV_FILE"

mkdir -p "$APP_DIR"

# ── 拉取/更新代码 ──────────────────────────────────────────────
echo "【前端】拉取最新代码..."
if [ -d "$REPO_DIR/.git" ]; then
    git -C "$REPO_DIR" pull
else
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$SCRIPT_DIR/package.json" ]; then
        REPO_DIR="$SCRIPT_DIR"
    else
        echo "❌ 找不到 package.json，请在仓库根目录执行此脚本"
        exit 1
    fi
fi

cd "$REPO_DIR"

# ── 写入生产环境变量 ───────────────────────────────────────────
cat > .env.production << FRONTENV
JAVA_API_BASE=${JAVA_API_BASE:-http://localhost:8080}
FRONTENV

# ── 安装依赖并构建 ─────────────────────────────────────────────
echo "【前端】安装依赖..."
npm ci --prefer-offline

echo "【前端】构建中..."
npm run build

# ── 配置 Nginx ────────────────────────────────────────────────
echo "【Nginx】更新配置..."
cat > /etc/nginx/conf.d/ai-app.conf << NGINXEOF
server {
    listen 80;
    server_name yudev.top www.yudev.top;
    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 80;
    server_name api.yudev.top;
    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINXEOF

nginx -t && systemctl reload nginx
echo "【Nginx】✅ 配置已生效"

# ── PM2 启动/重启 ──────────────────────────────────────────────
echo "【前端】启动服务..."
if pm2 describe yuAiGraph > /dev/null 2>&1; then
    pm2 reload yuAiGraph --update-env
else
    pm2 start npm --name "yuAiGraph" -- start
    pm2 save
    # 设置开机自启（只需第一次）
    pm2 startup | grep "sudo" | bash 2>/dev/null || true
fi

echo "【前端】✅ 启动成功"
echo "        日志: pm2 logs yuAiGraph"
