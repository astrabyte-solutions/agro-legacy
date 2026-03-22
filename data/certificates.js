/**
 * Certificate PDFs in /assets — fileName must match disk exactly.
 */

const CERTIFICATES = [
  {
    slug: 'apeda-rcmc',
    title: 'APEDA RCMC',
    subtitle: 'Registration–cum–Membership Certificate for agricultural exports',
    description:
      'RCMC from the Agricultural and Processed Food Products Export Development Authority (APEDA), required for export of scheduled products including pulses and allied commodities.',
    fileName: 'Apeda Rcmc_Surendra Pulses.pdf',
    downloadName: 'Surendra-Pulses-APEDA-RCMC.pdf',
    badge: 'Export',
    icon: 'fa-solid fa-file-shield',
    accent: 'from-emerald-800/90 to-primary',
  },
  {
    slug: 'fssai-central',
    title: 'FSSAI Central License',
    subtitle: 'Food Safety and Standards Authority of India',
    description:
      'Central licensing under FSSAI for food business operations, demonstrating compliance with national food safety standards.',
    fileName: 'Fssai ]CENTRAL _Surendra pulses.pdf',
    downloadName: 'Surendra-Pulses-FSSAI-Central.pdf',
    badge: 'Food safety',
    icon: 'fa-solid fa-clipboard-check',
    accent: 'from-amber-700/90 to-secondary',
  },
  {
    slug: 'iec',
    title: 'IEC (Importer–Exporter Code)',
    subtitle: 'Directorate General of Foreign Trade',
    description:
      'IEC issued for international trade, enabling import and export transactions in line with Indian foreign trade policy.',
    fileName: 'IEC_Surendra Pulses.pdf',
    downloadName: 'Surendra-Pulses-IEC.pdf',
    badge: 'Foreign trade',
    icon: 'fa-solid fa-passport',
    accent: 'from-sky-800/90 to-primary',
  },
];

function getBySlug(slug) {
  return CERTIFICATES.find((c) => c.slug === slug) || null;
}

module.exports = {
  CERTIFICATES,
  getBySlug,
};
