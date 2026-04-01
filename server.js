const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const catalog = require('./data/products');
const certificates = require('./data/certificates');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const DEFAULT_OG_IMAGE = '/assets/surendra_logo.png';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/vendor/fontawesome', express.static(path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free')));
app.use('/vendor/fontsource', express.static(path.join(__dirname, 'node_modules', '@fontsource')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

function absoluteUrl(pathname = '/') {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${SITE_URL}${clean}`;
}

function buildBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function baseSchemas() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Surendra Pulses',
      url: SITE_URL,
      logo: absoluteUrl('/assets/surendra_logo.png'),
      image: absoluteUrl('/assets/surendra_logo.png'),
      sameAs: [],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+91-6261605175',
          contactType: 'sales',
          email: 'surendrapulses@gmail.com',
          areaServed: ['IN', 'AE', 'SA', 'SG', 'US', 'GB'],
          availableLanguage: ['en', 'hi'],
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Surendra Pulses',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/products?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#localbusiness`,
      name: 'Surendra Pulses',
      image: absoluteUrl('/assets/surendra_logo.png'),
      url: SITE_URL,
      email: 'surendrapulses@gmail.com',
      telephone: '+91-6261605175',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '329/2 Nemawar Road, Palda, Idhyog Nagar',
        addressLocality: 'Indore',
        addressRegion: 'Madhya Pradesh',
        postalCode: '452020',
        addressCountry: 'IN',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '10:00',
          closes: '19:00',
        },
      ],
      areaServed: ['India', 'Asia', 'Middle East'],
      priceRange: '$$',
    },
  ];
}

function buildSeo(pathname, data = {}) {
  const canonicalPath = data.canonicalPath || pathname;
  const canonical = absoluteUrl(canonicalPath);
  const title = data.title || 'Surendra Pulses';
  const description = data.description || 'Surendra Pulses - pulses and agri commodity import-export supplier from Indore, India.';
  const image = absoluteUrl(data.image || DEFAULT_OG_IMAGE);
  const robots = data.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const hreflangs = data.hreflangs || [
    { lang: 'en-IN', href: canonical },
    { lang: 'en', href: canonical },
    { lang: 'x-default', href: canonical },
  ];
  const schemas = [...baseSchemas()];
  if (Array.isArray(data.breadcrumbs) && data.breadcrumbs.length > 0) {
    schemas.push(buildBreadcrumbSchema(data.breadcrumbs));
  }
  if (Array.isArray(data.schemas) && data.schemas.length > 0) {
    schemas.push(...data.schemas);
  }
  return {
    title,
    description,
    robots,
    canonical,
    image,
    twitterCard: 'summary_large_image',
    hreflangs,
    schemas,
  };
}

function asBool(v, fallback = false) {
  if (v === undefined || v === null || v === '') return fallback;
  return String(v).toLowerCase() === 'true';
}

function getMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_ENCRYPTION || '').toLowerCase() === 'ssl',
    auth: asBool(process.env.SMTP_AUTH, true) ? { user, pass } : undefined,
    tls: { rejectUnauthorized: !asBool(process.env.SMTP_DEBUG, false) },
  });
}

function norm(v) {
  return String(v || '').trim();
}

function buildMailBody(payload, type) {
  return [
    `Form Type: ${type}`,
    `Name: ${payload.name}`,
    `Company: ${payload.company || '-'}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Product: ${payload.product || '-'}`,
    `Message: ${payload.message || '-'}`,
    `Submitted At: ${new Date().toISOString()}`,
  ].join('\n');
}

function buildThankYouBody(type, payload) {
  const lines = [
    `Dear ${payload.name || 'Customer'},`,
    '',
    `Thank you for contacting Surendra Pulses.`,
  ];
  if (type === 'Enquiry' || type === 'Contact') {
    lines.push('We have received your request and our team will connect with you shortly.');
    lines.push('');
    lines.push('Your submission details:');
    lines.push(`- Name: ${payload.name || '-'}`);
    if (payload.company) lines.push(`- Company: ${payload.company}`);
    lines.push(`- Email: ${payload.email || '-'}`);
    lines.push(`- Phone: ${payload.phone || '-'}`);
    lines.push(`- Product Interest: ${payload.product || '-'}`);
    lines.push(`- Message: ${payload.message || '-'}`);
  } else if (type === 'Subscribe') {
    lines.push('You have been successfully subscribed to our website updates.');
    lines.push('');
    lines.push('Subscription details:');
    lines.push(`- Email: ${payload.email || '-'}`);
  }
  lines.push('');
  lines.push('Regards,');
  lines.push('Team Surendra Pulses');
  lines.push('Email: surendrapulses@gmail.com');
  lines.push('Phone: +91 6261605175');
  return lines.join('\n');
}

async function sendFormEmail(type, payload) {
  const transporter = getMailer();
  if (!transporter) {
    throw new Error('Mail transport not configured');
  }
  if (asBool(process.env.SMTP_VERIFY, false)) {
    await transporter.verify();
  }
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.SMTP_TO || process.env.SMTP_USER,
    cc: process.env.SMTP_CC || undefined,
    bcc: process.env.SMTP_BCC || undefined,
    replyTo: payload.email || undefined,
    subject: `[Website] ${type} from ${payload.name}`,
    text: buildMailBody(payload, type),
  };
  await transporter.sendMail(mailOptions);
  if (payload.email) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: payload.email,
      subject: `Thank you for your ${type.toLowerCase()} | Surendra Pulses`,
      text: buildThankYouBody(type, payload),
    });
  }
}

function parseFormPayload(req) {
  return {
    name: norm(req.body.name),
    company: norm(req.body.company),
    email: norm(req.body.email),
    phone: norm(req.body.phone),
    product: norm(req.body.product),
    message: norm(req.body.message),
  };
}

function parseSubscribePayload(req) {
  return {
    name: 'Subscriber',
    company: '',
    email: norm(req.body.email),
    phone: '',
    product: '',
    message: 'Newsletter subscription request from website footer.',
  };
}

function validatePayload(payload) {
  if (!payload.name || !payload.email || !payload.phone || !payload.message) {
    return 'Please fill all required fields.';
  }
  return null;
}

function validateSubscribePayload(payload) {
  if (!payload.email) return 'Please enter your email.';
  return null;
}

function renderNotFound(req, res) {
  return res.status(404).render('404', {
    layout: 'layouts/main',
    title: 'Page not found | Surendra Pulses',
    current: '',
    bodyClass: 'bg-white text-gray-900 font-sans',
    seo: buildSeo(req.path || '/404', {
      title: '404 | Page not found',
      description: 'The requested page was not found on Surendra Pulses website.',
      robots: 'noindex, nofollow',
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: '404', path: req.path || '/404' }],
    }),
  });
}

app.get('/', renderPage('home', {
  title: 'Surendra Pulses | Home',
  current: 'home',
  extraScriptsPartial: 'partials/scripts-hero-slider',
  productTypes: catalog.getProductTypes(),
  seo: buildSeo('/', {
    title: 'Surendra Pulses | Pulses Exporter and Processor in India',
    description: 'Surendra Pulses is a trusted pulses processor and exporter from Indore with 60+ years in agro commodity trade.',
    breadcrumbs: [{ name: 'Home', path: '/' }],
  }),
}));

app.get('/about', renderPage('about', {
  title: 'Surendra Pulses | About Us',
  current: 'about',
  bodyClass: 'bg-white text-gray-900 font-sans',
  extraScriptsPartial: 'partials/scripts-about',
  seo: buildSeo('/about', {
    title: 'About Surendra Pulses | 60+ Years Agro Trade Legacy',
    description: 'Learn about Surendra Pulses, our history since 1965, mission, vision, values, and trade-focused operations.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'About Us', path: '/about' }],
  }),
}));

const familySpecIntro = {
  toor: 'All pigeon pea (Toor) grades listed below are processed under supervision. Click a variant for its detail page.',
  moong: 'Green gram (moong) grades including polish and dal lines—select a line item for specifications.',
  chana: 'Bengal gram (chana) whole and dal grades for different market segments.',
  beans: 'Black-eyed and brown-eyed bean lines for domestic and export-oriented buyers.',
  peas: 'Cow peas and related lines for broad trade and distribution requirements.',
  'white-chickpeas': 'White chickpeas are offered as a dedicated product head for bulk and export-oriented buyers.',
  maize: 'Maize is offered as a dedicated product head for bulk supply and trade programs.',
  'black-gram': 'Black gram is offered as a dedicated product head for edible pulse trade and distribution.',
};

/** Product types only: /products */
app.get('/products', renderPage('products', {
  title: 'Products | Surendra Pulses',
  current: 'products',
  bodyClass: 'bg-light text-gray-800 font-sans',
  productTypes: catalog.getProductTypes(),
  seo: buildSeo('/products', {
    title: 'Products | Pulses Categories and Variants',
    description: 'Browse Surendra Pulses product categories including Toor, Moong, Chana, Cow Peas, Maize, and Black Gram.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Products', path: '/products' }],
  }),
}));

/** Product detail: /products/:category/:slug */
app.get('/products/:category/:slug', (req, res) => {
  const { category, slug } = req.params;
  if (!catalog.isValidCategoryId(category)) {
    return renderNotFound(req, res);
  }
  const product = catalog.getBySlug(slug);
  if (!product || product.category !== category) {
    return renderNotFound(req, res);
  }
  const productPath = `/products/${product.category}/${product.slug}`;
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(productPath)}#product`,
    name: product.name,
    description: product.description || product.shortDescription,
    image: [absoluteUrl(`/assets/${encodeURIComponent(product.imageFile)}`)],
    category: product.categoryLabel,
    sku: product.slug,
    brand: { '@type': 'Brand', name: 'Surendra Pulses' },
    countryOfOrigin: 'IN',
    areaServed: ['IN', 'AE', 'SA', 'SG', 'US', 'GB'],
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(productPath),
      priceCurrency: 'INR',
      price: '0.00',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      eligibleRegion: ['IN', 'AE', 'SA', 'SG', 'US', 'GB'],
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'INR',
        price: '0.00',
        description: 'Bulk pricing available on request based on quantity and destination.',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '37',
      bestRating: '5',
      worstRating: '1',
    },
    review: [
      {
        '@type': 'Review',
        author: { '@type': 'Person', name: 'Aadesh Singh' },
        reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
        reviewBody: "For the past 20 years, I've been placing orders with SP. They've been with us since the beginning.",
      },
    ],
  };
  const imageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: absoluteUrl(`/assets/${encodeURIComponent(product.imageFile)}`),
    name: `${product.name} product image`,
    caption: `${product.name} supplied by Surendra Pulses`,
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the minimum order quantity?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MOQ depends on product, packaging, and destination. Share your requirement through the enquiry form.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I request custom packaging?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, custom packaging is available subject to feasibility and order volume.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get a price?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Share product, quantity, destination country, and timeline. The team responds with quote details.',
        },
      },
    ],
  };
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
    seo: buildSeo(productPath, {
      title: `${product.name} | Surendra Pulses`,
      description: product.shortDescription || product.description || `${product.name} supplied by Surendra Pulses for domestic and export buyers.`,
      image: `/assets/${encodeURIComponent(product.imageFile)}`,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        { name: product.categoryLabel, path: `/products/${product.category}` },
        { name: product.name, path: productPath },
      ],
      schemas: [productSchema, imageSchema, faqSchema],
    }),
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
      seo: buildSeo(`/products/${segment}`, {
        title: `${categoryLabel} | Surendra Pulses Products`,
        description: `Explore ${categoryLabel} variants from Surendra Pulses for domestic and export supply.`,
        image: products[0] ? `/assets/${encodeURIComponent(products[0].imageFile)}` : DEFAULT_OG_IMAGE,
        breadcrumbs: [
          { name: 'Home', path: '/' },
          { name: 'Products', path: '/products' },
          { name: categoryLabel, path: `/products/${segment}` },
        ],
      }),
    });
  }
  const product = catalog.getBySlug(segment);
  if (product) {
    return res.redirect(301, `/products/${product.category}/${product.slug}`);
  }
  return renderNotFound(req, res);
});

app.get('/contact', renderPage('contact', {
  title: 'Surendra Pulses | Contact Us',
  current: 'contact',
  extraScriptsPartial: 'partials/scripts-contact-form',
  enquiryProductGroups: catalog.getEnquiryProductSelectGroups(),
  seo: buildSeo('/contact', {
    title: 'Contact Surendra Pulses | Trade Desk',
    description: 'Contact Surendra Pulses for import-export enquiries, bulk orders, and shipment planning.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }],
  }),
}));

app.get('/enquiry', renderPage('enquiry', {
  title: 'Surendra Pulses | Enquiry',
  current: 'enquiry',
  bodyClass: 'bg-white text-gray-900 font-sans',
  extraScriptsPartial: 'partials/scripts-enquiry',
  enquiryProductGroups: catalog.getEnquiryProductSelectGroups(),
  seo: buildSeo('/enquiry', {
    title: 'Enquiry Form | Surendra Pulses',
    description: 'Submit your product enquiry for quantity, destination, and timeline to receive a trade quote.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Enquiry', path: '/enquiry' }],
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to request a trade quote from Surendra Pulses',
        step: [
          { '@type': 'HowToStep', name: 'Share requirement', text: 'Submit product name, quantity, and destination through the enquiry form.' },
          { '@type': 'HowToStep', name: 'Receive quote', text: 'Our team shares pricing, availability, and packaging options.' },
          { '@type': 'HowToStep', name: 'Confirm dispatch', text: 'Finalize order and coordinate dispatch and documents.' },
        ],
      },
    ],
  }),
}));

app.post('/api/forms/enquiry', async (req, res) => {
  const payload = parseFormPayload(req);
  const err = validatePayload(payload);
  if (err) return res.status(400).json({ ok: false, error: err });
  try {
    await sendFormEmail('Enquiry', payload);
    return res.json({ ok: true, message: 'Enquiry submitted successfully.' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Unable to submit enquiry right now.' });
  }
});

app.post('/api/forms/contact', async (req, res) => {
  const payload = parseFormPayload(req);
  const err = validatePayload(payload);
  if (err) return res.status(400).json({ ok: false, error: err });
  try {
    await sendFormEmail('Contact', payload);
    return res.json({ ok: true, message: 'Contact request submitted successfully.' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Unable to submit contact request right now.' });
  }
});

app.post('/api/forms/subscribe', async (req, res) => {
  const payload = parseSubscribePayload(req);
  const err = validateSubscribePayload(payload);
  if (err) return res.status(400).json({ ok: false, error: err });
  try {
    await sendFormEmail('Subscribe', payload);
    return res.json({ ok: true, message: 'Subscription completed successfully.' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Unable to subscribe right now.' });
  }
});

app.get('/certificates', (req, res) => {
  res.render('certificates', {
    layout: 'layouts/main',
    title: 'Certificates & Compliance | Surendra Pulses',
    current: 'certificates',
    bodyClass: 'bg-light text-gray-800 font-sans',
    certificates: certificates.CERTIFICATES,
    seo: buildSeo('/certificates', {
      title: 'Certificates & Compliance | Surendra Pulses',
      description: 'View APEDA, FSSAI, and IEC certificates of Surendra Pulses for quality and export compliance.',
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Certificates', path: '/certificates' }],
    }),
  });
});

app.get('/certificates/:slug', (req, res) => {
  const cert = certificates.getBySlug(req.params.slug);
  if (!cert) {
    return renderNotFound(req, res);
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
    seo: buildSeo(`/certificates/${cert.slug}`, {
      title: `${cert.title} | Surendra Pulses`,
      description: cert.description,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Certificates', path: '/certificates' },
        { name: cert.title, path: `/certificates/${cert.slug}` },
      ],
    }),
  });
});

app.get('/robots.txt', (req, res) => {
  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
  ];
  res.type('text/plain').send(lines.join('\n'));
});

app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const staticPaths = ['/', '/about', '/products', '/contact', '/enquiry', '/certificates'];
  const categoryPaths = catalog.CATEGORY_IDS.map((id) => `/products/${id}`);
  const productPaths = catalog.PRODUCTS.map((p) => `/products/${p.category}/${p.slug}`);
  const certificatePaths = certificates.CERTIFICATES.map((c) => `/certificates/${c.slug}`);
  const allPaths = [...staticPaths, ...categoryPaths, ...productPaths, ...certificatePaths];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allPaths.map((p) => {
      return [
        '  <url>',
        `    <loc>${absoluteUrl(p)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
      ].join('\n');
    }),
    '</urlset>',
  ].join('\n');

  res.type('application/xml').send(xml);
});

app.use((req, res) => {
  return renderNotFound(req, res);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

