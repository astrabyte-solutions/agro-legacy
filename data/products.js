/**
 * Product catalog — loaded from /products.json (project root).
 * Edit products.json to add or change products; imageFile must match a file in /assets.
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'products.json');

function loadCatalog() {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  const products = Array.isArray(data.products) ? data.products : [];
  const filterCategories = Array.isArray(data.filterCategories) ? data.filterCategories : [];
  return { products, filterCategories };
}

const { products: PRODUCTS, filterCategories: FILTER_CATEGORIES } = loadCatalog();

/** URL segment for listing sub-products: toor | moong | chana | others */
const CATEGORY_IDS = FILTER_CATEGORIES.filter((c) => c.id !== 'all').map((c) => c.id);

function isValidCategoryId(id) {
  return CATEGORY_IDS.includes(id);
}

/** Cards for /products — product types only */
function getProductTypes() {
  return FILTER_CATEGORIES.filter((c) => c.id !== 'all').map((c) => {
    const items = getByCategory(c.id);
    return {
      id: c.id,
      label: c.label,
      count: items.length,
      previewImage: items[0]?.imageFile || null,
    };
  });
}

function getBySlug(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}

function getByCategory(category) {
  return PRODUCTS.filter((p) => p.category === category);
}

function getCategoryVariantRows(product) {
  return getByCategory(product.category).map((p) => ({
    name: p.name,
    description: p.shortDescription,
    slug: p.slug,
    category: p.category,
    current: p.slug === product.slug,
  }));
}

function getGalleryFiles(product) {
  const siblings = getByCategory(product.category);
  const files = [...new Set(siblings.map((p) => p.imageFile))];
  const main = product.imageFile;
  const rest = files.filter((f) => f !== main);
  return [main, ...rest].slice(0, 4);
}

function getRelated(product, limit = 4) {
  const same = PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug);
  const other = PRODUCTS.filter((p) => p.slug !== product.slug && p.category !== product.category);
  return [...same, ...other].slice(0, limit);
}

/**
 * Grouped product options for enquiry + contact forms (same catalog as /products).
 * Each group: { id, label, items: [{ value: slug, label: name }] }.
 */
function getEnquiryProductSelectGroups() {
  const order = FILTER_CATEGORIES.filter((c) => c.id !== 'all');
  const groups = [];
  for (const cat of order) {
    const items = PRODUCTS.filter((p) => p.category === cat.id)
      .map((p) => ({ value: p.slug, label: p.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
    if (items.length) {
      groups.push({ id: cat.id, label: cat.label, items });
    }
  }
  return groups;
}

module.exports = {
  PRODUCTS,
  FILTER_CATEGORIES,
  CATEGORY_IDS,
  isValidCategoryId,
  getProductTypes,
  getBySlug,
  getByCategory,
  getCategoryVariantRows,
  getGalleryFiles,
  getRelated,
  getEnquiryProductSelectGroups,
};
