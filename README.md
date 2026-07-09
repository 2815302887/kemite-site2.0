# Kemite Website

Kemite Website 是一个面向焊接材料与电子制造场景的企业官网项目，包含前台展示、产品中心、产品详情、留言表单和后台管理能力。项目采用 Node.js/Express 统一提供静态页面和 API，产品数据处于 MySQL 优先读取、JSON 兜底、后台写入双写观察的迁移阶段。

## 技术栈

- 前端：HTML、CSS、原生 JavaScript
- 3D 展示：React Three Fiber、Three.js、Vite、esbuild
- 后端：Node.js、Express
- 数据库：MySQL
- 鉴权：JWT、bcrypt
- 文件上传：multer
- 部署：Nginx、PM2
- 数据源：MySQL、`products.json`、`public/products-data.js`

## 功能模块

- 官网页面：首页、产品中心、产品详情、关于我们、联系我们
- 产品展示：产品筛选、搜索、详情渲染、图片与 PDF 资料展示
- 3D 展示：产品模型构建、模型数据嵌入和首页交互展示
- 留言管理：前台留言提交、后台查看、标记已读、导出和删除
- 后台管理：管理员登录、产品新增、编辑、删除、排序、图片/PDF 上传
- 图片库：产品图片列表、使用状态判断、单个或批量删除
- 产品数据库化：MySQL 表结构、JSON 到 MySQL 迁移、对比和同步工具

## 项目结构

```text
.
├── index.html
├── products.html
├── product.html
├── about.html
├── contact.html
├── admin.html
├── styles/
├── src/
│   ├── admin/
│   ├── components/
│   └── utils/
├── public/
│   ├── images/
│   ├── products-data.js
│   ├── products/
│   └── datasheets/
├── products/
│   └── models/
├── server/
│   ├── sql/init.sql
│   └── src/
│       ├── config/
│       ├── controller/
│       ├── middleware/
│       ├── model/
│       ├── routes/
│       └── service/
├── tools/
├── docs/
├── products.json
├── package.json
├── README.md
└── DEPLOY.md
```

## 本地运行

安装依赖：

```bash
npm install
```

构建前端模型与静态数据：

```bash
npm run build
```

启动开发环境服务：

```bash
npm run serve
```

默认访问地址：

```text
http://127.0.0.1:3001
http://127.0.0.1:3001/admin.html
```

初始化数据库：

```bash
npm run db:init
```

产品 JSON 到 MySQL 同步和对比：

```bash
node tools/sync-products-json-to-db.js
node tools/sync-products-json-to-db.js --execute
node tools/compare-products.js --env=.env.development
```

## 环境变量说明

只在本地或服务器环境文件中配置真实值，不要提交真实配置。

| 字段名 | 用途 |
| --- | --- |
| `NODE_ENV` | 运行环境 |
| `PORT` | Express 服务端口 |
| `JWT_SECRET` | 后台登录 JWT 签名密钥 |
| `CORS_ORIGINS` | 生产环境允许的跨域来源 |
| `ADMIN_USERNAME` | 后台管理员用户名 |
| `ADMIN_PASSWORD` | 后台管理员密码 |
| `UPLOAD_LIMIT_MB` | 上传文件大小限制 |
| `JSON_LIMIT` | JSON 请求体大小限制 |
| `BACKUP_RETENTION` | 本地备份保留数量 |
| `CONTACT_RATE_LIMIT_WINDOW_MS` | 留言限流时间窗口 |
| `CONTACT_RATE_LIMIT_MAX` | 留言限流次数 |
| `DB_HOST` | MySQL 主机 |
| `DB_PORT` | MySQL 端口 |
| `DB_USER` | MySQL 用户 |
| `DB_PASSWORD` | MySQL 密码 |
| `DB_NAME` | MySQL 数据库名 |
| `DB_CONNECTION_LIMIT` | MySQL 连接池大小 |

## 构建命令

```bash
npm run build
```

该命令会执行：

- `tools/build-r3f-bundle.js`
- `tools/embed-model-data.js`

可选模型优化：

```bash
npm run models:optimize
```

## 部署说明

生产部署请查看 [DEPLOY.md](./DEPLOY.md)。推荐架构为：

```text
Nginx :80/:443
  -> 127.0.0.1:3001
  -> Node.js / Express
  -> MySQL
```

## 安全提醒

- 不要提交 `.env.production`、`.env.development`、`.env.test` 或任何真实 `.env` 文件。
- 不要把数据库密码、后台密码、JWT 密钥写入文档、代码注释或提交记录。
- 生产环境必须使用强随机 `JWT_SECRET`。
- 生产环境必须配置 `CORS_ORIGINS`。
- 上传目录和备份目录应保持在 `.gitignore` 中。
- GitHub 上传前执行 `git status --short` 和敏感文件检查。
