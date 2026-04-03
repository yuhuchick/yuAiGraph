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
# 小内存 ECS 上 npm ci / next build 易被 OOM Kill（进程 exit 显示 Killed）。
# 建议服务器至少 2G swap，例如：
#   fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
# 可在 deploy.env 中覆盖：
#   NODE_OPTIONS_CI="--max-old-space-size=512"
#   NODE_OPTIONS_BUILD="--max-old-space-size=1024"
echo "【前端】安装依赖..."
if [ -n "${NODE_OPTIONS_CI:-}" ]; then export NODE_OPTIONS="$NODE_OPTIONS_CI"; else export NODE_OPTIONS="--max-old-space-size=768"; fi
npm ci --prefer-offline --no-audit --no-fund

echo "【前端】构建中..."
if [ -n "${NODE_OPTIONS_BUILD:-}" ]; then export NODE_OPTIONS="$NODE_OPTIONS_BUILD"; else export NODE_OPTIONS="--max-old-space-size=1024"; fi
npm run build
unset NODE_OPTIONS

# ── 配置 Nginx ────────────────────────────────────────────────
echo "【Nginx】更新配置..."
# 可选：在 deploy.env 里写 SERVER_PUBLIC_IP=47.x.x.x，用 IP 访问时也能命中同一站点
# shellcheck disable=SC2154
SERVER_NAMES="yudev.top www.yudev.top"
if [ -n "${SERVER_PUBLIC_IP:-}" ]; then
    SERVER_NAMES="$SERVER_NAMES $SERVER_PUBLIC_IP"
fi

cat > /etc/nginx/conf.d/ai-app.conf << NGINXEOF
# default_server：用公网 IP 直接访问时也会走 Next，避免落到别的默认站点导致静态资源 500
server {
    listen 80 default_server;
    server_name $SERVER_NAMES;
    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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

# ── PM2 启动/重启（必须指定 cwd，否则重启后可能在错误目录，/_next/static 会 500）──
echo "【前端】启动服务..."
if pm2 describe yuAiGraph > /dev/null 2>&1; then
    pm2 delete yuAiGraph 2>/dev/null || true
fi
pm2 start npm --name "yuAiGraph" --cwd "$REPO_DIR" -- start
pm2 save
pm2 startup | grep "sudo" | bash 2>/dev/null || true

echo "【前端】✅ 启动成功"
echo "        日志: pm2 logs yuAiGraph"
