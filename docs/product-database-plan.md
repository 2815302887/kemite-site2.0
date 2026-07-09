# 产品数据库化方案

> 本文档只描述产品数据从 JSON 逐步迁移到 MySQL 的方案，不实施代码改造，不修改数据库，不改变现有接口路径。

## 一、当前产品数据存储现状

### products.json 的作用

`products.json` 是当前产品主数据的服务端来源，承载产品型号、名称、分类、应用、合金、图片、PDF 资料、简介、详情和参数信息。后端产品服务读取该文件后提供前台 `/api/products` 和后台产品管理相关能力。

### public/products-data.js 的作用

`public/products-data.js` 是前台静态 fallback 数据。当前产品详情页和产品中心会优先请求接口；接口不可用时，页面仍可以从 `window.KEMITE_PRODUCTS` 读取静态产品数据，保证官网在弱后端或静态打开场景下仍可展示基础产品信息。

### 当前前台 /api/products 和 fallback 的关系

前台统一通过 `getProducts()` 获取产品列表：

- 优先请求 `/api/products`。
- 请求成功时使用接口返回数据。
- 请求失败时回退到 `public/products-data.js` 中的 `window.KEMITE_PRODUCTS`。
- 产品筛选、详情查找和详情渲染仍在前端内存中完成。

### 当前后台产品管理和 JSON 数据的关系

后台产品管理接口仍以 JSON 文件为主数据来源，支持产品新增、编辑、删除、上下移动、分页读取和上传图片/PDF 后写入产品字段。后台保存后需要同步影响前台读取的数据，当前做法适合小规模产品维护。

### 当前方案的优点和问题

优点：

- 实现简单，部署成本低。
- 产品量小时读取速度足够。
- 静态 fallback 可靠，前台抗故障能力较好。
- 不依赖产品数据库表，迁移风险低。

问题：

- 并发写入可靠性弱，后台多人同时编辑时存在覆盖风险。
- 多图、多资料、分类管理扩展困难。
- 搜索、分页、排序能力依赖文件读取和内存处理，产品量变大后维护成本上升。
- 图片库与产品引用关系不够结构化。
- 后续资料下载记录、产品统计、上下架审核等能力不便实现。

## 二、为什么需要数据库化

数据库化的核心价值不是“为了技术升级”，而是让产品数据从单文件维护变成可查询、可关联、可审计的结构化数据。

- 数据一致性：通过主键、外键、唯一索引和事务，降低产品、图片、资料之间的数据不一致。
- 后台管理可靠性：新增、编辑、删除、排序等操作可以做到更明确的写入边界。
- 多图、多资料扩展：产品封面、详情图、包装图、MSDS、TDS、证书等可以独立管理。
- 分类管理：分类可以独立维护 slug、排序、状态，避免每个产品重复写分类文本。
- 排序、上下架、搜索、分页：使用 SQL 索引支持后台分页和前台查询，避免全量读取。
- 后续统计：可扩展资料下载记录、产品访问统计、热门产品、资料版本管理。

## 三、推荐 MySQL 表结构

### 1. product_categories

用于管理产品分类，例如锡膏、红胶、助焊剂、资料证书等。

| 字段名 | 字段类型 | 必填 | 默认值 | 字段用途 |
| --- | --- | --- | --- | --- |
| id | BIGINT UNSIGNED | 是 | 自增 | 主键 |
| name | VARCHAR(100) | 是 | 无 | 分类名称 |
| slug | VARCHAR(120) | 是 | 无 | 分类标识，用于筛选和 URL |
| description | VARCHAR(500) | 否 | NULL | 分类说明 |
| status | TINYINT | 是 | 1 | 1 启用，0 禁用 |
| sort_order | INT | 是 | 0 | 分类排序 |
| created_at | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 是 | CURRENT_TIMESTAMP | 更新时间 |

主键：

- `PRIMARY KEY (id)`

索引建议：

- `UNIQUE KEY uk_product_categories_slug (slug)`
- `KEY idx_product_categories_status_sort (status, sort_order)`

### 2. products

用于存储产品主体信息。

| 字段名 | 字段类型 | 必填 | 默认值 | 字段用途 |
| --- | --- | --- | --- | --- |
| id | VARCHAR(80) | 是 | 无 | 产品型号或业务主键，兼容当前 query id |
| category_id | BIGINT UNSIGNED | 否 | NULL | 关联分类 |
| name | VARCHAR(200) | 是 | 无 | 产品名称 |
| slug | VARCHAR(220) | 是 | 无 | 产品 URL 标识 |
| summary | VARCHAR(1000) | 否 | NULL | 产品简介 |
| description | TEXT | 否 | NULL | 产品详细介绍 |
| application | VARCHAR(200) | 否 | NULL | 应用场景，兼容当前字段 |
| alloy | VARCHAR(200) | 否 | NULL | 合金体系，兼容当前字段 |
| keywords | VARCHAR(500) | 否 | NULL | 搜索关键词 |
| cover_image | VARCHAR(500) | 否 | NULL | 产品封面图路径 |
| datasheet | VARCHAR(500) | 否 | NULL | 当前单资料兼容字段 |
| meta | JSON | 否 | NULL | 参数信息，兼容当前 meta 数组 |
| status | TINYINT | 是 | 1 | 1 上架，0 下架，2 草稿 |
| sort_order | INT | 是 | 0 | 产品排序 |
| created_at | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 是 | CURRENT_TIMESTAMP | 更新时间 |

主键：

- `PRIMARY KEY (id)`

外键：

- `category_id` 可关联 `product_categories(id)`，建议初期使用软约束或延后开启外键，降低迁移风险。

索引建议：

- `UNIQUE KEY uk_products_slug (slug)`
- `KEY idx_products_status (status)`
- `KEY idx_products_category_id (category_id)`
- `KEY idx_products_sort_order (sort_order)`
- `KEY idx_products_name (name)`
- `KEY idx_products_status_sort (status, sort_order)`

### 3. product_images

用于管理产品多图、封面图、图片排序和 alt 文案。

| 字段名 | 字段类型 | 必填 | 默认值 | 字段用途 |
| --- | --- | --- | --- | --- |
| id | BIGINT UNSIGNED | 是 | 自增 | 主键 |
| product_id | VARCHAR(80) | 是 | 无 | 关联产品 |
| image_path | VARCHAR(500) | 是 | 无 | 图片路径 |
| alt | VARCHAR(255) | 否 | NULL | 图片 alt 文案 |
| sort_order | INT | 是 | 0 | 图片排序 |
| is_cover | TINYINT | 是 | 0 | 是否封面图 |
| created_at | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |

主键：

- `PRIMARY KEY (id)`

外键：

- `product_id` 关联 `products(id)`

索引建议：

- `KEY idx_product_images_product_id (product_id)`
- `KEY idx_product_images_product_sort (product_id, sort_order)`
- `KEY idx_product_images_cover (product_id, is_cover)`

### 4. product_documents

用于管理产品 PDF 资料、证书、MSDS、TDS 和版本。

| 字段名 | 字段类型 | 必填 | 默认值 | 字段用途 |
| --- | --- | --- | --- | --- |
| id | BIGINT UNSIGNED | 是 | 自增 | 主键 |
| product_id | VARCHAR(80) | 是 | 无 | 关联产品 |
| file_path | VARCHAR(500) | 是 | 无 | 文件路径 |
| file_name | VARCHAR(255) | 是 | 无 | 文件展示名 |
| file_type | VARCHAR(80) | 是 | `datasheet` | 文件类型，如 datasheet、msds、certificate |
| version | VARCHAR(80) | 否 | NULL | 文件版本 |
| sort_order | INT | 是 | 0 | 资料排序 |
| created_at | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |

主键：

- `PRIMARY KEY (id)`

外键：

- `product_id` 关联 `products(id)`

索引建议：

- `KEY idx_product_documents_product_id (product_id)`
- `KEY idx_product_documents_type (file_type)`
- `KEY idx_product_documents_product_sort (product_id, sort_order)`

### 5. product_meta 或 products.meta JSON 字段

推荐初期使用 `products.meta JSON` 字段，减少迁移复杂度，保留当前前端 `meta: [[label, value]]` 的数据结构。

如果后续需要参数筛选、参数统计或参数模板管理，可以再拆成 `product_meta` 表：

| 字段名 | 字段类型 | 必填 | 默认值 | 字段用途 |
| --- | --- | --- | --- | --- |
| id | BIGINT UNSIGNED | 是 | 自增 | 主键 |
| product_id | VARCHAR(80) | 是 | 无 | 关联产品 |
| label | VARCHAR(120) | 是 | 无 | 参数名 |
| value | VARCHAR(500) | 是 | 无 | 参数值 |
| sort_order | INT | 是 | 0 | 参数排序 |

索引建议：

- `KEY idx_product_meta_product_id (product_id)`
- `KEY idx_product_meta_label (label)`

## 四、核心字段建议

### products 表核心字段

- `id`：继续兼容当前产品 query id 和后台编辑逻辑，建议保留业务可读型号。
- `category_id`：关联分类表，逐步替代当前字符串数组分类。
- `name`：产品展示名称。
- `slug`：用于未来 SEO URL 或稳定链接。
- `summary`：前台卡片和详情简介。
- `description`：详情页正文。
- `cover_image`：产品主图，兼容当前 `image` 字段。
- `datasheet`：单 PDF 兼容字段，后续由 `product_documents` 替代。
- `meta`：JSON 参数信息，兼容当前数组结构。
- `status`：上架、下架、草稿。
- `sort_order`：后台上下移动和前台排序依据。
- `created_at` / `updated_at`：审计和同步检查。

### product_images 表核心字段

- `id`：图片记录主键。
- `product_id`：关联产品。
- `image_path`：图片文件路径。
- `alt`：图片替代文本。
- `sort_order`：多图排序。
- `is_cover`：是否为封面图。
- `created_at`：上传或关联时间。

### product_documents 表核心字段

- `id`：资料记录主键。
- `product_id`：关联产品。
- `file_path`：文件路径。
- `file_name`：展示名。
- `file_type`：资料类型，如 datasheet、MSDS、证书。
- `version`：资料版本。
- `sort_order`：资料排序。
- `created_at`：创建时间。

## 五、索引设计

建议至少建立以下索引：

- `products.status`：支持前台只查询上架产品，后台筛选状态。
- `products.category_id`：支持分类筛选。
- `products.sort_order`：支持产品排序和分页。
- `products.name`：支持后台按名称搜索。
- `products.status, sort_order`：支持前台上架产品列表按排序读取。
- `product_images.product_id`：支持产品详情加载图片。
- `product_documents.product_id`：支持产品详情加载资料。

后续如果搜索需求变复杂，可以考虑：

- MySQL `FULLTEXT(name, summary, keywords, description)`。
- 或保留当前简单 LIKE 查询，产品量较小时更容易维护。

## 六、迁移策略

建议采用“先并行、后切换”的低风险迁移：

1. 备份 `products.json` 和 `public/products-data.js`。
2. 创建新表：`product_categories`、`products`、`product_images`、`product_documents`。
3. 编写一次性迁移脚本，把 `products.json` 解析为 SQL 数据。
4. 先只读数据库，不改后台写入；后台仍写 JSON。
5. 增加对比逻辑，比较 JSON 和 MySQL 返回的产品数量、id、name、image、datasheet、meta。
6. 切换 `/api/products` 到数据库读取，保留 JSON fallback。
7. 后台 `/api/admin/products` 写入切换到数据库。
8. 保留 JSON fallback 一段时间，并定期生成 `public/products-data.js`。
9. 稳定后再废弃 `public/products-data.js` 的产品主数据角色。

## 七、接口切换方案

### 前台 /api/products

当前：

- 从 JSON 读取产品数组。

目标：

- 从 `products` 查询 `status = 1` 的产品。
- 按 `sort_order` 排序。
- 聚合 `product_images` 和 `product_documents`。
- 输出结构保持和当前前端兼容，继续包含 `id/name/category/application/alloy/image/datasheet/meta` 等字段。

### 后台 /api/admin/products

当前：

- 从 JSON 分页读取。
- 新增、编辑、删除、上下移动写回 JSON。

目标：

- 列表从 SQL 分页读取。
- 新增插入 `products`。
- 编辑更新 `products` 主表，并按需要维护图片和资料表。
- 删除可以先软删除或设置 `status = 0`，避免误删。
- 返回结构保持兼容旧字段。

### 排序接口

当前：

- 通过 JSON 数组顺序实现上下移动。

目标：

- 使用 `sort_order`。
- 上移/下移时交换当前产品和相邻产品的 `sort_order`。
- 建议在事务中完成，避免排序重复。

### 图片库和 product_images 的关系

当前：

- 图片库通过扫描文件和产品引用判断 `used`。

目标：

- 上传图片后写入图片记录或文件记录。
- 产品引用图片时写入 `product_images`。
- 图片库 `used` 可由 `product_images.image_path` 是否存在关联判断。
- 删除图片前检查是否有关联产品。

### datasheet 和 product_documents 的关系

当前：

- 产品只有一个 `datasheet` 字段。

目标：

- `datasheet` 字段作为兼容输出。
- 新资料写入 `product_documents`。
- 默认取 `file_type = datasheet` 且 `sort_order` 最小或版本最新的记录作为兼容字段。

## 八、回滚方案

### 数据库异常时回退到 JSON

- 保留 `products.json` 作为短期 fallback。
- `/api/products` 数据库读取失败时可回退 JSON。
- 后台写入切库初期，应保留手动导出 SQL 到 JSON 的工具。

### 重新生成 public/products-data.js

- 从当前可信数据源生成 `window.KEMITE_PRODUCTS`。
- 切换初期可以从 JSON 生成。
- 数据库稳定后可以从 SQL 生成。

### 保留老接口兼容

- 不改变 `/api/products`、`/api/admin/products` 路径。
- 不改变前端依赖字段。
- SQL model 层负责把数据库结构映射回当前产品对象。

### 回滚风险点

- SQL 写入后 JSON 未同步，回滚时可能丢失最新后台修改。
- 图片和资料关联表如果未同步回单字段，前台 fallback 可能缺资料。
- 排序从数组顺序变成 `sort_order` 后，回滚需要重新生成 JSON 顺序。
- 多资料、多图上线后，旧 JSON 结构无法完整承载新能力。

## 九、分阶段上线计划

第一步：只建表和迁移脚本

- 新增 SQL 表。
- 编写一次性迁移脚本。
- 迁移后人工抽查数据。

第二步：接口双读对比

- `/api/products` 仍返回 JSON。
- 后端内部同时读取 SQL，输出对比日志。
- 对比字段包括数量、id、名称、分类、图片、资料、meta。

第三步：前台切数据库只读

- `/api/products` 改为 SQL 读取。
- 保留 JSON fallback。
- 前台页面无需改路径。

第四步：后台写入数据库

- `/api/admin/products` 新增、编辑、删除、排序切到 SQL。
- 上传图片和 PDF 建立关联记录。
- 保持返回字段兼容。

第五步：JSON fallback 保留观察

- 定期从 SQL 生成 `products.json` 和 `public/products-data.js`。
- 观察一段时间，确认前后台稳定。

第六步：完全数据库化

- 产品主数据以 SQL 为唯一可信来源。
- JSON 只作为构建产物或静态降级文件。
- 后续再考虑删除旧 JSON 写入逻辑。

## 十、暂不实施的原因

- 当前产品量小，JSON 方案仍能稳定运行。
- 前台已有 `/api/products` + `public/products-data.js` fallback，短期可用性较好。
- 直接迁移数据库会影响后台新增、编辑、排序、图片引用和资料下载链路，风险较高。
- 当前更适合先形成方案文档，等测试环境、备份策略和对比脚本准备好后再实施。

## 后续实施第一步建议

真正开始数据库化时，建议第一步只做“建表 SQL + 只读迁移脚本 + 数据对比报告”，不要立刻切换接口。先确认 MySQL 中的数据能完整还原当前 `products.json`，再进入双读对比阶段。
