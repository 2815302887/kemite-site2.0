# 项目优化记录

本文记录 Kemite Website 的主要优化和迁移工作，便于后续维护、部署和交接。

## 1. 后台模块拆分

后台管理能力已按职责拆分：

- 管理员登录：`adminController`、`authService`、`adminModel`
- 留言管理：`adminContactController`、`contactService`、`contactModel`
- 产品管理：`adminProductController`、`productService`、`productModel`
- 图片管理：`imageController`、`imageService`、`fileModel`
- 上传管理：`uploadController`、`uploadService`、`upload` middleware
- 路由拆分：`server/src/routes/admin.js` 和 `server/src/routes/public.js`

拆分后，控制器负责请求响应，服务层负责业务流程，模型层负责数据读写，便于后续维护。

## 2. 安全稳定性优化

已完成的安全与稳定性优化：

- 后台接口增加 JWT 鉴权。
- 登录密码使用 bcrypt 校验。
- 留言接口增加频率限制。
- 上传接口限制文件类型和大小。
- 响应头增加基础安全策略。
- 生产环境要求配置 `JWT_SECRET`。
- 生产环境要求配置 `CORS_ORIGINS`。
- 后台数据库同步失败时不向前端暴露敏感错误详情。
- `.gitignore` 排除真实环境文件、上传目录、资料目录和备份目录。

## 3. 产品数据库化迁移

产品数据从 JSON 逐步迁移到 MySQL，目标是提升可维护性、查询能力和后台管理可靠性。

已完成内容：

- 新增产品数据库表结构：`docs/sql/product-schema.sql`
- 支持产品分类、产品主表、多分类关系、产品图片、产品资料和产品 meta JSON。
- 新增只读迁移脚本：`tools/migrate-products-readonly.js`
- 新增 MySQL-only 验证接口：`GET /api/products-db`
- 公共产品接口 `GET /api/products` 调整为 MySQL 优先读取，失败时回退 JSON。

## 4. 双写观察期

当前阶段是双写观察期：

- `products.json` 仍是后台产品操作的主写入源。
- `public/products-data.js` 仍由 JSON 生成并作为兼容兜底。
- MySQL 在 JSON 写入成功后同步。
- 后台新增、编辑、删除和排序会尝试同步 MySQL。
- MySQL 同步失败时，后台操作仍以 JSON 成功为准，并记录服务端警告。

该阶段的目标是降低迁移风险，在保持现有前后台功能可用的同时验证 MySQL 数据一致性。

## 5. 同步工具和对比工具

新增运维工具：

- `tools/sync-products-json-to-db.js`
- `tools/compare-products.js`

同步工具能力：

- 默认 dry-run，不写入数据库。
- 传入 `--execute` 后才执行写入。
- 将 `products.json` 中的产品同步到 MySQL。
- 同步分类、产品主数据、图片、PDF 资料、meta 和排序。
- 将 JSON 中不存在的 MySQL 活跃产品标记为 inactive。
- 不物理删除 MySQL 产品记录。

对比工具能力：

- 对比 JSON 产品和 MySQL 活跃产品。
- 输出缺失产品、额外产品、字段差异和匹配状态。
- 用于部署后和双写观察期的运维确认。

## 6. 构建与资源优化

已整理的构建流程：

- `npm run build` 构建 React Three Fiber 相关前端包。
- `tools/embed-model-data.js` 生成模型数据。
- `tools/optimize-glb-models.js` 可用于 GLB 模型优化。
- 产品图片、模型、品牌图片和 PDF 资料保持独立目录管理。

## 7. GitHub 上传安全处理

上传 GitHub 前已执行安全检查：

- 检查 `git status --short`。
- 确认真实 `.env` 文件未进入提交。
- 确认 `.env.production`、`.env.development`、`.env.test` 被忽略。
- 确认上传目录、资料目录和备份目录被忽略。
- 未提交真实数据库密码、JWT 密钥或后台密码。
- 远程仓库配置为 `https://github.com/2815302887/kemite-site.git`。

## 8. 文档编码修复

发现 `README.md`、`DEPLOY.md`、`UPDATE_RECORD.md` 中存在大量不可逆替换字符。由于原文已无法通过编码转换恢复，已根据当前项目代码和有效文档重新生成三份 Markdown：

- `README.md`
- `DEPLOY.md`
- `UPDATE_RECORD.md`

新文档使用 UTF-8 编码，不包含替换字符，内容面向 GitHub 展示、服务器部署和项目维护。

## 9. 后续建议

- 继续观察双写阶段的 MySQL 同步稳定性。
- 增加数据库同步结果的操作日志。
- 将后台产品写入逐步切换为 MySQL 主写。
- 保留 JSON 导出能力作为回滚和备份方案。
- 在完全稳定后再弱化 `public/products-data.js` 的主数据角色。
- 部署前持续执行敏感文件检查和产品数据对比。
