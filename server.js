const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const catalog = require('./data/products');
const certificates = require('./data/certificates');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use((req, res, next) => {
  res.locals.assetUrl = (filename) => '/assets/' + encodeURIComponent(filename);
  res.locals.productUrl = (p) => `/products/${p.category}/${p.slug}`;
  next();
});

function renderPage(view, options = {}) {
  return (req, res) => {
    res.render(view, {
      title: options.title || 'Surendra Pulses',
      bodyClass: options.bodyClass !== undefined ? options.bodyClass : 'bg-white text-gray-800 font-sans',
      current: options.current || '',
      extraScriptsPartial: options.extraScriptsPartial || null,
      extraHead: options.extraHead || '',
      ...options,
    });
  };
}

app.get('/', renderPage('home', {
  title: 'Surendra Pulses | Home',
  current: 'home',
  extraScriptsPartial: 'partials/scripts-hero-slider',
  productTypes: catalog.getProductTypes(),
}));

app.get('/about', renderPage('about', {
  title: 'Surendra Pulses | About Us',
  current: 'about',
  bodyClass: 'bg-white text-gray-900 font-sans',
  extraScriptsPartial: 'partials/scripts-about',
}));

const familySpecIntro = {
  toor: 'All pigeon pea (Toor) grades listed below are processed under supervision. Click a variant for its detail page.',
  moong: 'Green gram (moong) grades including polish and dal lines—select a line item for specifications.',
  chana: 'Bengal gram (chana) whole and dal grades for different market segments.',
  others: 'Additional commodities in our portfolio.',
};

/** Product types only: /products */
app.get('/products', renderPage('products', {
  title: 'Products | Surendra Pulses',
  current: 'products',
  bodyClass: 'bg-light text-gray-800 font-sans',
  productTypes: catalog.getProductTypes(),
}));

/** Product detail: /products/:category/:slug */
app.get('/products/:category/:slug', (req, res) => {
  const { category, slug } = req.params;
  if (!catalog.isValidCategoryId(category)) {
    return res.status(404).render('404', {
      layout: 'layouts/main',
      title: 'Page not found | Surendra Pulses',
      current: '',
      bodyClass: 'bg-white text-gray-900 font-sans',
    });
  }
  const product = catalog.getBySlug(slug);
  if (!product || product.category !== category) {
    return res.status(404).render('404', {
      layout: 'layouts/main',
      title: 'Page not found | Surendra Pulses',
      current: '',
      bodyClass: 'bg-white text-gray-900 font-sans',
    });
  }
  res.render('product-details', {
    layout: 'layouts/main',
    title: `${product.name} | Surendra Pulses`,
    current: 'products',
    bodyClass: 'bg-white text-gray-900 font-sans',
    product,
    categoryVariants: catalog.getCategoryVariantRows(product),
    galleryFiles: catalog.getGalleryFiles(product),
    relatedProducts: catalog.getRelated(product, 4),
    variantCount: catalog.getByCategory(product.category).length,
    specIntro: familySpecIntro[product.category] || '',
  });
});

/**
 * One segment after /products: category listing OR legacy /products/old-slug → redirect to /products/cat/slug
 */
app.get('/products/:segment', (req, res) => {
  const { segment } = req.params;
  if (catalog.isValidCategoryId(segment)) {
    const products = catalog.getByCategory(segment);
    const meta = catalog.FILTER_CATEGORIES.find((c) => c.id === segment);
    const categoryLabel = meta ? meta.label : segment;
    return res.render('products-category', {
      layout: 'layouts/main',
      title: `${categoryLabel} | Products | Surendra Pulses`,
      current: 'products',
      bodyClass: 'bg-beige text-gray-800 font-sans',
      category: segment,
      categoryLabel,
      products,
    });
  }
  const product = catalog.getBySlug(segment);
  if (product) {
    return res.redirect(301, `/products/${product.category}/${product.slug}`);
  }
  return res.status(404).render('404', {
    layout: 'layouts/main',
    title: 'Page not found | Surendra Pulses',
    current: '',
    bodyClass: 'bg-white text-gray-900 font-sans',
  });
});

app.get('/contact', renderPage('contact', {
  title: 'Surendra Pulses | Contact Us',
  current: 'contact',
  enquiryProductGroups: catalog.getEnquiryProductSelectGroups(),
}));

app.get('/enquiry', renderPage('enquiry', {
  title: 'Surendra Pulses | Enquiry',
  current: 'enquiry',
  bodyClass: 'bg-white text-gray-900 font-sans',
  extraScriptsPartial: 'partials/scripts-enquiry',
  enquiryProductGroups: catalog.getEnquiryProductSelectGroups(),
}));

app.get('/certificates', (req, res) => {
  res.render('certificates', {
    layout: 'layouts/main',
    title: 'Certificates & Compliance | Surendra Pulses',
    current: 'certificates',
    bodyClass: 'bg-light text-gray-800 font-sans',
    certificates: certificates.CERTIFICATES,
  });
});

app.get('/certificates/:slug', (req, res) => {
  const cert = certificates.getBySlug(req.params.slug);
  if (!cert) {
    return res.status(404).render('404', {
      layout: 'layouts/main',
      title: 'Page not found | Surendra Pulses',
      current: '',
      bodyClass: 'bg-white text-gray-900 font-sans',
    });
  }
  const pdfUrl = '/assets/' + encodeURIComponent(cert.fileName);
  res.render('certificate-view', {
    layout: 'layouts/main',
    title: `${cert.title} | Surendra Pulses`,
    current: 'certificates',
    bodyClass: 'bg-white text-gray-900 font-sans',
    cert,
    pdfUrl,
    allCerts: certificates.CERTIFICATES,
  });
});

app.use((req, res) => {
  res.status(404).render('404', {
    layout: 'layouts/main',
    title: 'Page not found | Surendra Pulses',
    current: '',
    bodyClass: 'bg-white text-gray-900 font-sans',
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
