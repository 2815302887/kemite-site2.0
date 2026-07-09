# Product Database Migration Status

## 1. Current Stage

The project is in the double-write observation stage.

Current source strategy:

- Public read path prefers MySQL.
- Public read path falls back to JSON when MySQL is unavailable.
- Admin write path still uses `products.json` as the primary write source.
- Admin write path synchronizes to MySQL after JSON writes succeed.
- MySQL is not yet the only product write source.

## 2. Completed Steps

### Database Schema

Completed:

- `docs/sql/product-schema.sql`
- Tables:
  - `product_categories`
  - `products`
  - `product_category_map`
  - `product_images`
  - `product_documents`

The schema supports product categories, multiple category relations, product images, PDF documents, product meta JSON, sorting, and status control.

### Read-only Migration Script

Completed:

- `tools/migrate-products-readonly.js`

Capabilities:

- Reads from `products.json`.
- Supports dry-run by default.
- Writes to MySQL only with `--execute`.
- Outputs product, category, image, and PDF counts.

### Data Comparison Script

Completed:

- `tools/compare-products.js`

Capabilities:

- Compares `products.json` with MySQL active products.
- Outputs missing products, extra products, mismatched fields, and `matched`.
- Reports inactive MySQL product count separately.

### MySQL-only Test API

Completed:

- `GET /api/products-db`

Behavior:

- Reads only from MySQL.
- Does not fallback to JSON.
- Used for verification and comparison.

### Public Product API MySQL-first Read

Completed:

- `GET /api/products`

Behavior:

- Reads MySQL first.
- Falls back to original JSON data if MySQL is not configured, unavailable, or query fails.
- Keeps the original frontend response structure.

### Admin JSON-primary Write With MySQL Sync

Completed:

- Admin create product: writes JSON first, then syncs MySQL.
- Admin update product: writes JSON first, then syncs MySQL.
- Admin delete product: removes from JSON, then marks MySQL product `status = 0`.
- Admin product move: updates JSON order, then syncs MySQL `sort_order`.

If MySQL sync fails:

- Admin operation still succeeds.
- JSON remains the source of truth.
- Server logs a warning.
- Sensitive database errors are not returned to the frontend.

### Manual JSON to MySQL Sync Tool

Completed:

- `tools/sync-products-json-to-db.js`
- `docs/product-sync-operations.md`

Capabilities:

- Dry-run by default.
- Writes only with `--execute`.
- Fully synchronizes JSON products into MySQL.
- Marks active MySQL products missing from JSON as inactive.
- Does not physically delete MySQL product records.

## 3. Current API Status

### `GET /api/products`

Current role:

- Official public product API.

Current behavior:

- MySQL first.
- JSON fallback.
- Response shape remains compatible with the original frontend.

### `GET /api/products-db`

Current role:

- MySQL-only verification API.

Current behavior:

- Reads only active MySQL products.
- Returns unified response format:

```json
{
  "code": 200,
  "msg": "success",
  "success": true,
  "data": []
}
```

### Admin Product APIs

Current role:

- Existing backend product management APIs.

Current behavior:

- JSON remains the primary write target.
- `public/products-data.js` is still regenerated from JSON.
- MySQL is synchronized after JSON write success.
- Interface paths and frontend admin code are unchanged.

## 4. Current Data Status

Latest verified state:

```json
{
  "jsonProductCount": 10,
  "mysqlActiveProductCount": 10,
  "mysqlInactiveProductCount": 1,
  "matched": true
}
```

Notes:

- The inactive product is a preserved MySQL record from delete verification.
- Active MySQL products match `products.json`.
- `compare-products.js` only compares active MySQL products with JSON.

## 5. Current Risks

### JSON Is Still The Primary Admin Write Source

Admin writes are not fully database-native yet. JSON remains the source of truth for backend product management.

### MySQL May Temporarily Lag Behind

During double-write observation, if MySQL sync fails after a JSON write succeeds, MySQL may temporarily contain stale product data.

Mitigation:

- Server warning logs.
- Manual sync script.
- Comparison script.

### Full Database Write Is Not Implemented Yet

The admin product management flow has not been switched to full MySQL writes.

### `public/products-data.js` Still Exists

`public/products-data.js` is still generated and retained as a fallback/static compatibility layer.

## 6. Operations Fallback

### Dry-run Sync

Use dry-run first:

```bash
node tools/sync-products-json-to-db.js
```

With explicit environment:

```bash
node tools/sync-products-json-to-db.js --env=.env.development
```

### Execute Sync

After confirming dry-run output:

```bash
node tools/sync-products-json-to-db.js --execute
```

With explicit environment:

```bash
node tools/sync-products-json-to-db.js --execute --env=.env.development
```

### Compare

After sync:

```bash
node tools/compare-products.js --env=.env.development
```

Expected:

```json
{
  "missingInSql": [],
  "extraInSql": [],
  "mismatches": [],
  "matched": true
}
```

## 7. Follow-up Recommendations

Recommended next steps:

1. Observe double-write stability for a period of normal admin usage.
2. Add more operation logs around MySQL sync results.
3. Move admin product create/update/delete/sort to MySQL as the primary write source.
4. Keep JSON as backup export during the transition.
5. Add a controlled export tool from MySQL back to `products.json`.
6. Gradually retire `public/products-data.js` after all frontend fallback paths are confirmed unnecessary.

## 8. Rollback Strategy

Rollback principles:

- Do not delete `products.json`.
- Do not delete `public/products-data.js`.
- Keep `/api/products` fallback behavior until full database migration is stable.

If MySQL data becomes unreliable:

1. Keep admin writes on JSON.
2. Run `tools/compare-products.js` to identify differences.
3. Run `tools/sync-products-json-to-db.js` in dry-run mode.
4. Execute sync from JSON to MySQL if dry-run looks correct.
5. If needed, temporarily revert `/api/products` to JSON-only read.

Because JSON is still preserved, rollback remains low risk at this stage.

## 9. Interview Explanation Version

This project originally stored product data in JSON files, which was simple and stable for a small product catalog but had limitations for long-term maintainability, searching, relations, and admin operations.

I migrated it in small steps instead of rewriting everything at once:

1. Designed MySQL product tables for categories, products, images, documents, and metadata.
2. Built a dry-run migration script from JSON to MySQL.
3. Added a comparison tool to verify JSON and MySQL data consistency.
4. Added a MySQL-only test endpoint `/api/products-db`.
5. Changed the public `/api/products` endpoint to read MySQL first and fallback to JSON.
6. Kept the admin write flow JSON-first, then added MySQL synchronization after successful JSON writes.
7. Added a manual JSON-to-MySQL sync tool as an operations fallback.

The key point is that the migration was incremental and reversible. Existing frontend pages and admin features kept working during every step, while MySQL gradually became capable of carrying the product data. This reduced migration risk and made it possible to verify correctness through active comparison before switching to full database writes.
