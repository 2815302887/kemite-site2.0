# Kemite Website 部署指南

本文档说明如何在 Ubuntu 服务器上部署 Kemite Website。推荐使用 Node.js + MySQL + PM2 + Nginx + HTTPS 的方式运行，Nginx 负责公网入口，Express 服务运行在本机端口。

## 1. 服务器准备

推荐系统：

- Ubuntu 22.04 LTS
- Ubuntu 24.04 LTS

更新系统：

```bash
sudo apt update
sudo apt upgrade -y
```

安装基础工具：

```bash
sudo apt install -y git curl build-essential nginx mysql-server
```

安装 Node.js 20：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

安装 PM2：

```bash
sudo npm install -g pm2
```

检查版本：

```bash
node -v
npm -v
mysql --version
nginx -v
pm2 -v
```

## 2. 部署目录

建议部署到：

```bash
/var/www/kemite-site
```

拉取代码：

```bash
sudo mkdir -p /var/www/kemite-site
sudo chown -R $USER:$USER /var/www/kemite-site
git clone <your-repository-url> /var/www/kemite-site
cd /var/www/kemite-site
```

如果是覆盖发布，先备份以下数据目录：

```text
products.json
public/products/
public/datasheets/
backups/
```

## 3. MySQL 配置

登录 MySQL：

```bash
sudo mysql
```

创建数据库和应用用户。请使用自己的强密码，不要把真实密码写入文档或提交：

```sql
CREATE DATABASE kemite_site DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kemite_app'@'localhost' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON kemite_site.* TO 'kemite_app'@'localhost';
FLUSH PRIVILEGES;
```

退出 MySQL：

```sql
EXIT;
```

## 4. `.env.production` 配置

在服务器上创建 `.env.production`，只保存在线上服务器，不提交到 Git：

```bash
cp .env.example .env.production
```

需要配置的字段：

```text
NODE_ENV
PORT
JWT_SECRET
CORS_ORIGINS
ADMIN_USERNAME
ADMIN_PASSWORD
UPLOAD_LIMIT_MB
JSON_LIMIT
BACKUP_RETENTION
CONTACT_RATE_LIMIT_WINDOW_MS
CONTACT_RATE_LIMIT_MAX
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
DB_CONNECTION_LIMIT
```

注意：

- `JWT_SECRET` 必须使用强随机值。
- `ADMIN_PASSWORD` 必须使用强密码。
- `DB_PASSWORD` 使用数据库用户的真实密码，但不要写入仓库。
- `CORS_ORIGINS` 填写生产域名。
- `PORT` 建议使用 `3001`，由 Nginx 反向代理。

## 5. 安装依赖与构建

安装依赖：

```bash
npm install
```

构建静态资源和模型数据：

```bash
npm run build
```

## 6. 数据库初始化

确认 `.env.production` 已配置数据库字段后执行：

```bash
npm run db:init
```

该命令会执行 `server/sql/init.sql`，创建项目所需的基础表结构。

产品数据库化使用独立 SQL：

```bash
mysql -u <db-user> -p <db-name> < docs/sql/product-schema.sql
```

## 7. 产品 JSON 同步到 MySQL

当前项目处于双写观察期：

- 后台写入仍以 `products.json` 为主。
- MySQL 在 JSON 写入成功后同步。
- `/api/products` 优先读取 MySQL，失败时回退 JSON。

先 dry-run：

```bash
node tools/sync-products-json-to-db.js --env=.env.production
```

确认输出无误后执行：

```bash
node tools/sync-products-json-to-db.js --execute --env=.env.production
```

同步后对比：

```bash
node tools/compare-products.js --env=.env.production
```

期望结果中 `matched` 为 `true`，并且缺失、额外和字段差异为空。

## 8. PM2 启动

启动生产服务：

```bash
pm2 start "npm run start" --name kemite-site
```

保存 PM2 进程列表：

```bash
pm2 save
```

设置开机自启：

```bash
pm2 startup
```

查看日志：

```bash
pm2 logs kemite-site
```

重启服务：

```bash
pm2 restart kemite-site
```

## 9. Nginx 反向代理

创建站点配置：

```bash
sudo nano /etc/nginx/sites-available/kemite-site
```

示例配置：

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/kemite-site /etc/nginx/sites-enabled/kemite-site
sudo nginx -t
sudo systemctl reload nginx
```

## 10. HTTPS

安装 Certbot：

```bash
sudo apt install -y certbot python3-certbot-nginx
```

申请证书：

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

检查自动续期：

```bash
sudo certbot renew --dry-run
```

## 11. 上线验收清单

- 首页可以正常打开，无白屏。
- 产品中心可正常加载、搜索和筛选。
- 产品详情页图片、参数、PDF 链接正常。
- 3D 展示资源加载成功。
- 留言表单可提交，限流生效。
- 后台登录、退出、刷新保持登录状态正常。
- 后台产品新增、编辑、删除、排序正常。
- 图片和 PDF 上传正常，刷新后仍可访问。
- `/api/health` 返回正常。
- `/api/products` 返回产品列表。
- `/api/products-db` 可用于 MySQL 验证。
- `tools/compare-products.js` 对比通过。
- Nginx、PM2、MySQL 日志无明显错误。
- HTTPS 证书有效，HTTP 可跳转到 HTTPS。

## 12. 回滚方式

回滚代码：

```bash
cd /var/www/kemite-site
git fetch --all
git checkout <previous-commit-or-tag>
npm install
npm run build
pm2 restart kemite-site
```

回滚产品数据：

1. 恢复发布前备份的 `products.json`。
2. 恢复 `public/products/` 和 `public/datasheets/`。
3. 运行同步 dry-run。
4. 确认无误后执行 JSON 到 MySQL 同步。
5. 执行对比工具确认一致。

如果 MySQL 临时不可用：

- 保留 `products.json`。
- 保留 `public/products-data.js`。
- 暂停依赖 MySQL-only 的验证流程。
- 修复数据库后重新运行同步和对比工具。

## 13. 安全提醒

- 不要提交 `.env.production`。
- 不要在文档、提交信息或截图里暴露真实密码、JWT 密钥或数据库连接信息。
- 上传目录、资料目录和备份目录应排除在 Git 提交之外。
- 发布前执行 `git status --short`，确认没有敏感文件被暂存。
