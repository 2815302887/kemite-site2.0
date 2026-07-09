-- Product database preparation schema.
-- This file is for the future database migration only. It is not used by the
-- current /api/products or admin product management code.
--
-- Note: the existing project may already have a product_images table used by
-- the image library. Review the current database before applying this schema
-- to a shared environment.

CREATE TABLE IF NOT EXISTS product_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  status TINYINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_categories_slug (slug),
  KEY idx_product_categories_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(80) NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  summary VARCHAR(1000) NULL,
  description TEXT NULL,
  application VARCHAR(200) NULL,
  alloy VARCHAR(200) NULL,
  keywords VARCHAR(500) NULL,
  cover_image VARCHAR(500) NULL,
  datasheet VARCHAR(500) NULL,
  meta JSON NULL,
  status TINYINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_products_slug (slug),
  KEY idx_products_status (status),
  KEY idx_products_category_id (category_id),
  KEY idx_products_sort_order (sort_order),
  KEY idx_products_name (name),
  KEY idx_products_status_sort (status, sort_order),
  CONSTRAINT fk_products_category_id
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_category_map (
  product_id VARCHAR(80) NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, category_id),
  KEY idx_product_category_map_category (category_id),
  CONSTRAINT fk_product_category_map_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_product_category_map_category
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id VARCHAR(80) NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  alt VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_cover TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_images_product_path (product_id, image_path),
  KEY idx_product_images_product_id (product_id),
  KEY idx_product_images_product_sort (product_id, sort_order),
  KEY idx_product_images_cover (product_id, is_cover),
  CONSTRAINT fk_product_images_product_id
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id VARCHAR(80) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(80) NOT NULL DEFAULT 'datasheet',
  version VARCHAR(80) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_documents_product_path (product_id, file_path),
  KEY idx_product_documents_product_id (product_id),
  KEY idx_product_documents_type (file_type),
  KEY idx_product_documents_product_sort (product_id, sort_order),
  CONSTRAINT fk_product_documents_product_id
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

