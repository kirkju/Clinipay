const { Router } = require('express');
const PackageModel = require('../models/package.model');

const router = Router();

router.get('/sitemap.xml', async (req, res) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://clinipay.com';

  let packages = [];
  try {
    packages = await PackageModel.findAllActive();
  } catch {
    // If DB is unreachable, generate sitemap with static pages only
  }

  const staticPages = [
    { url: '/', changefreq: 'weekly', priority: '1.0' },
    { url: '/packages', changefreq: 'weekly', priority: '0.9' },
    { url: '/login', changefreq: 'monthly', priority: '0.3' },
    { url: '/register', changefreq: 'monthly', priority: '0.3' },
  ];

  const dynamicPages = packages.map((pkg) => ({
    url: `/packages/${pkg.id}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: pkg.updated_at
      ? new Date(pkg.updated_at).toISOString().split('T')[0]
      : undefined,
  }));

  const allPages = [...staticPages, ...dynamicPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

module.exports = router;
