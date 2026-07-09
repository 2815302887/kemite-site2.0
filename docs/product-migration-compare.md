# 产品 JSON 到 MySQL 迁移准备说明

本阶段只新增迁移准备文件，不接入现有接口，不修改 `products.json`，不修改 `public/products-data.js`，不影响当前网站运行。

## 新增文件

- `docs/sql/product-schema.sql`：产品数据库化建表 SQL。
- `tools/migrate-products-readonly.js`：从 `products.json` 读取产品并生成迁移计划，默认 dry-run。
- `tools/compare-products.js`：对比 `products.json` 与 MySQL 中产品数据是否一致。
- `docs/product-migration-compare.md`：本文档。

## 表结构说明

本次准备的表包括：

- `product_categories`：产品分类。
- `products`：产品主体信息。
- `product_category_map`：产品多分类关联。当前 `products.json` 中 `category` 是数组，因此保留多分类关系。
- `product_images`：产品图片。
- `product_documents`：产品 PDF 资料。

其中 `products.category_id` 存放第一个分类，作为主分类；完整分类数组通过 `product_category_map` 保留。

## 迁移脚本用法

默认 dry-run，不写入数据库：

```bash
node tools/migrate-products-readonly.js
```

指定环境文件：

```bash
node tools/migrate-products-readonly.js --env=.env.development
```

确认建表完成后，才可以显式写入：

```bash
node tools/migrate-products-readonly.js --execute --env=.env.development
```

脚本会输出：

- 产品数量
- 分类数量
- 图片数量
- PDF 数量
- 将要迁移的产品摘要

## 对比脚本用法

在执行迁移后，对比 JSON 和 MySQL：

```bash
node tools/compare-products.js --env=.env.development
```

输出内容包括：

- `jsonCount`
- `sqlCount`
- `missingInSql`
- `extraInSql`
- `mismatches`
- `matched`

当 `matched` 为 `true` 时，说明关键字段已经能从 SQL 还原当前 JSON 数据。

## 当前不切换接口

本阶段不会修改：

- `/api/products`
- `/api/admin/products`
- 后台新增、编辑、删除、排序逻辑
- `products.json`
- `public/products-data.js`

当前网站仍继续使用现有 JSON 产品数据流。

## 注意事项

1. 当前项目已有 `product_images` 表用于图片库记录，新 SQL 中的 `product_images` 是未来产品图片关联表。真正执行前请检查线上数据库是否已有同名表。
2. `products.json` 的分类是数组，单个 `products.category_id` 无法完整表达，因此新增 `product_category_map`。
3. `datasheet` 当前是产品单字段，迁移时同时写入 `products.datasheet` 和 `product_documents`，保持兼容。
4. `meta` 初期保存在 `products.meta JSON` 字段，暂不拆 `product_meta` 表。
5. 只有传入 `--execute` 才会写入数据库；默认只打印 dry-run 结果。

## 后续建议

真正进入下一阶段前，建议先在测试数据库中执行：

1. 手动备份 `products.json` 和 `public/products-data.js`。
2. 执行 `docs/sql/product-schema.sql`。
3. 运行 dry-run 检查迁移计划。
4. 使用 `--execute` 写入测试数据库。
5. 运行 `tools/compare-products.js` 对比字段。
6. 确认一致后，再考虑 `/api/products` 双读对比，不要直接切换生产接口。
