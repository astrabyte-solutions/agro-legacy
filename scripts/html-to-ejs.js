const fs = require('fs');
const path = require('path');

const replacements = [
  [/href="Home - Agro Legacy\.html"/g, 'href="/"'],
  [/href="About Us\.html"/g, 'href="/about"'],
  [/href="Product Showcase\.html"/g, 'href="/products"'],
  [/href="Contact Us\.html"/g, 'href="/contact"'],
  [/href="Enquiry Form\.html"/g, 'href="/enquiry"'],
  [/src="assets\//g, 'src="/assets/'],
  [/href="assets\//g, 'href="/assets/'],
];

function convert(html) {
  let out = html;
  for (const [re, to] of replacements) {
    out = out.replace(re, to);
  }
  return out;
}

const map = [
  ['views/tmp/home.extract.html', 'views/home.ejs'],
  ['views/tmp/about.extract.html', 'views/about.ejs'],
  ['views/tmp/products.extract.html', 'views/products.ejs'],
  ['views/tmp/contact.extract.html', 'views/contact.ejs'],
  ['views/tmp/enquiry.extract.html', 'views/enquiry.ejs'],
  ['views/tmp/product-details.extract.html', 'views/product-details.ejs'],
];

for (const [src, dest] of map) {
  const raw = fs.readFileSync(path.join(__dirname, '..', src), 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', dest), convert(raw));
}
console.log('Wrote views/*.ejs');
