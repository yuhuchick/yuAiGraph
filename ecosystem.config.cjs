/**
 * PM2 生产环境配置：必须固定 cwd，否则 reload 后可能不在项目目录，
 * Next 读不到 .next，/_next/static 会 500。
 */
module.exports = {
  apps: [
    {
      name: "yuAiGraph",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 0.0.0.0",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
