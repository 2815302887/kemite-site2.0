# Product JSON to MySQL Sync Operations

This document describes the manual fallback workflow for the double-write observation period.

Current write strategy:

- `products.json` is still the primary write source for admin product operations.
- `public/products-data.js` is still generated from `products.json`.
- MySQL is synchronized after JSON writes.
- `/api/products` reads MySQL first and falls back to JSON when MySQL is unavailable.
- `/api/products-db` remains a MySQL-only comparison endpoint.

## When To Run The Sync Script

Run `tools/sync-products-json-to-db.js` when any of these happen:

- Admin product operations succeeded but server logs show `MySQL sync failed`.
- `/api/products` and `/api/products-db` return different product counts.
- `tools/compare-products.js` reports missing products or mismatched fields.
- MySQL was temporarily unavailable during product edits.
- Before deploying a version that depends more heavily on database reads.

## Dry Run

Dry-run is the default mode and does not write to MySQL:

```bash
node tools/sync-products-json-to-db.js
```

With an explicit environment file:

```bash
node tools/sync-products-json-to-db.js --env=.env.development
```

Dry-run outputs:

- JSON product count
- MySQL active product count before sync
- Products that would be inserted
- Products that would be updated
- Products that would be marked inactive
- Category, image, and PDF counts

Review the output before executing.

## Execute Sync

Only run execute mode after dry-run looks correct:

```bash
node tools/sync-products-json-to-db.js --execute
```

Or with an explicit environment file:

```bash
node tools/sync-products-json-to-db.js --execute --env=.env.development
```

Execute mode:

- Upserts every product from `products.json` into MySQL.
- Synchronizes categories and `product_category_map`.
- Synchronizes product cover images into `product_images`.
- Synchronizes `datasheet` into `product_documents`.
- Writes `meta` into the MySQL JSON field.
- Preserves JSON order through `sort_order`.
- Marks active MySQL products missing from JSON as `status = 0`.
- Does not physically delete MySQL product records.

## Compare After Sync

After execute mode, run:

```bash
node tools/compare-products.js --env=.env.development
```

Expected result:

```json
{
  "missingInSql": [],
  "extraInSql": [],
  "mismatches": [],
  "matched": true
}
```

`inactiveSqlCount` may be greater than zero. That is expected when old or deleted products are kept in MySQL with `status = 0`.

## If Sync Fails

If the sync script fails:

1. Do not switch any interfaces.
2. Confirm `.env.development` points to the expected test database.
3. Check MySQL connectivity and table existence.
4. Run dry-run again.
5. Re-run execute only after the issue is clear.

The script uses a transaction for database writes. If a write fails midway, the transaction is rolled back.

## Rollback

During the double-write observation period, the safest rollback is to keep using JSON as the source of truth:

1. Stop relying on `/api/products-db` for verification.
2. Fix MySQL data separately.
3. Re-run `tools/sync-products-json-to-db.js --execute` from the current `products.json`.

If `/api/products` must immediately stop reading MySQL, revert the service change that makes it call `getPublicProducts()`. Do not delete `products.json` or `public/products-data.js`.

## Manual Verification Checklist

1. Run dry-run and confirm counts.
2. Run execute.
3. Run compare.
4. Open `/api/products`.
5. Open `/api/products-db`.
6. Confirm both return the same active product count.
7. Confirm product center still renders normally.
