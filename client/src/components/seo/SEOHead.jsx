import { Helmet } from 'react-helmet-async';

const SEOHead = ({
  title,
  description,
  path,
  image,
  type = 'website',
  noIndex = false,
  structuredData,
}) => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://clinipay.com';
  const fullUrl = `${baseUrl}${path}`;
  const fullImage = image || `${baseUrl}/og-default.jpg`;
  const siteName = 'CLINIPAY';

  return (
    <Helmet>
      <title>{title ? `${title} | ${siteName}` : `${siteName} — Paquetes Médicos en Línea`}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title || siteName} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="es_HN" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || siteName} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      <link rel="alternate" hrefLang="x-default" href={fullUrl} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
