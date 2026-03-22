const fs = require('fs');
const path = require('path');

fs.mkdirSync(path.join(__dirname, '../views/tmp'), { recursive: true });

function slice(file, startStr, endStr) {
  const s = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const i = s.indexOf(startStr);
  const j = s.indexOf(endStr);
  if (i < 0 || j < 0) throw new Error(`${file}: not found ${startStr} / ${endStr}`);
  return s.slice(i, j + endStr.length);
}

fs.writeFileSync(
  path.join(__dirname, '../views/tmp/home.extract.html'),
  slice('html/Home - Agro Legacy.html', '<main>', '</main>')
);
fs.writeFileSync(
  path.join(__dirname, '../views/tmp/about.extract.html'),
  slice('html/About Us.html', '<main>', '</main>')
);

const ps = fs.readFileSync(path.join(__dirname, '../html/Product Showcase.html'), 'utf8');
fs.writeFileSync(
  path.join(__dirname, '../views/tmp/products.extract.html'),
  ps.slice(ps.indexOf('<main'), ps.indexOf('</main>') + 7)
);

const en = fs.readFileSync(path.join(__dirname, '../html/Enquiry Form.html'), 'utf8');
fs.writeFileSync(
  path.join(__dirname, '../views/tmp/enquiry.extract.html'),
  en.slice(en.indexOf('<section id="hero-banner"'), en.indexOf('<!-- Footer -->')).trim()
);

const pd = fs.readFileSync(path.join(__dirname, '../html/Product Details.html'), 'utf8');
fs.writeFileSync(
  path.join(__dirname, '../views/tmp/product-details.extract.html'),
  `<main>\n${pd.slice(pd.indexOf('<!-- Section 1: Product Hero'), pd.indexOf('<!-- Footer -->')).trim()}\n</main>`
);

fs.writeFileSync(
  path.join(__dirname, '../views/tmp/contact.extract.html'),
  slice('html/Contact Us.html', '<main>', '</main>')
);

console.log('Extracted to views/tmp/');
