// ─── SCHEMA MARKUP BUILDER ───────────────────────────────────────────────────
// Generates JSON-LD structured data for every page type.
// Google uses this for rich results, local pack, FAQ snippets, etc.

export interface SchemaContext {
  name: string;
  url?: string;
  phone?: string;
  email?: string;
  address?: string;
  city: string;
  state: string;
  description?: string;
  founded?: string | null;
  serviceArea?: string;
  industry?: string;
}

function scriptTag(obj: object): string {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

// ─── LOCAL BUSINESS (homepage + about) ───────────────────────────────────────

export function localBusinessSchema(b: SchemaContext, services?: Array<{ name: string }>, faqs?: Array<{ question: string; answer: string }>): string {
  const schemas: object[] = [];

  // Determine @type from industry
  const industry = (b.industry || "").toLowerCase();
  let businessType = "LocalBusiness";
  if (industry.includes("law") || industry.includes("attorney") || industry.includes("legal")) businessType = "LegalService";
  else if (industry.includes("accounting") || industry.includes("cpa") || industry.includes("bookkeeping")) businessType = "AccountingService";
  else if (industry.includes("financial") || industry.includes("advisor") || industry.includes("wealth")) businessType = "FinancialService";
  else if (industry.includes("medical") || industry.includes("clinic") || industry.includes("physician")) businessType = "MedicalClinic";
  else if (industry.includes("dental")) businessType = "Dentist";
  else if (industry.includes("chiropractic")) businessType = "Chiropractor";
  else if (industry.includes("plumb")) businessType = "Plumber";
  else if (industry.includes("electric")) businessType = "Electrician";
  else if (industry.includes("roofing") || industry.includes("roofer")) businessType = "RoofingContractor";
  else if (industry.includes("hvac")) businessType = "HVACBusiness";
  else if (industry.includes("landscap") || industry.includes("lawn")) businessType = "LandscapingBusiness";
  else if (industry.includes("paint")) businessType = "PaintingContractor";
  else if (industry.includes("hair") || industry.includes("salon")) businessType = "HairSalon";
  else if (industry.includes("real estate")) businessType = "RealEstateAgent";
  else if (industry.includes("insurance")) businessType = "InsuranceAgency";

  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": businessType,
    "name": b.name,
    "description": b.description || `${b.name} serving ${b.serviceArea || `${b.city}, ${b.state}`}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": b.city,
      "addressRegion": b.state,
      "addressCountry": "US",
    },
    "areaServed": b.serviceArea || `${b.city}, ${b.state}`,
    "priceRange": "$$",
  };

  if (b.phone) localBusiness["telephone"] = b.phone;
  if (b.email) localBusiness["email"] = b.email;
  if (b.url) localBusiness["url"] = b.url;
  if (b.founded) localBusiness["foundingDate"] = b.founded;

  if (services && services.length > 0) {
    localBusiness["hasOfferCatalog"] = {
      "@type": "OfferCatalog",
      "name": "Services",
      "itemListElement": services.map((s, i) => ({
        "@type": "Offer",
        "position": i + 1,
        "itemOffered": {
          "@type": "Service",
          "name": s.name,
        },
      })),
    };
  }

  schemas.push(localBusiness);

  // FAQ schema if we have FAQs
  if (faqs && faqs.length > 0) {
    schemas.push(faqSchema(faqs));
  }

  return schemas.map(scriptTag).join("\n");
}

// ─── SERVICE PAGE ─────────────────────────────────────────────────────────────

export function serviceSchema(
  b: SchemaContext,
  service: { name: string; description: string },
  faqs?: Array<{ question: string; answer: string }>
): string {
  const schemas: object[] = [];

  schemas.push({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description,
    "provider": {
      "@type": "LocalBusiness",
      "name": b.name,
      ...(b.phone && { "telephone": b.phone }),
      ...(b.email && { "email": b.email }),
      "address": {
        "@type": "PostalAddress",
        "addressLocality": b.city,
        "addressRegion": b.state,
        "addressCountry": "US",
      },
    },
    "areaServed": b.serviceArea || `${b.city}, ${b.state}`,
    "serviceType": service.name,
  });

  // Breadcrumb
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "../index.html" },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": "../services.html" },
      { "@type": "ListItem", "position": 3, "name": service.name },
    ],
  });

  if (faqs && faqs.length > 0) {
    schemas.push(faqSchema(faqs));
  }

  return schemas.map(scriptTag).join("\n");
}

// ─── BIO / PERSON PAGE ────────────────────────────────────────────────────────

export function personSchema(
  b: SchemaContext,
  member: {
    name: string;
    title?: string;
    bio?: string;
    credentials?: string;
    education?: string;
    linkedin?: string;
  }
): string {
  const schemas: object[] = [];

  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": member.name,
    "worksFor": {
      "@type": "Organization",
      "name": b.name,
    },
  };

  if (member.title) person["jobTitle"] = member.title;
  if (member.bio) person["description"] = member.bio.slice(0, 300);
  if (member.linkedin) person["sameAs"] = member.linkedin;

  if (member.credentials) {
    person["hasCredential"] = member.credentials.split(",").map(c => ({
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": c.trim(),
    }));
  }

  if (member.education) {
    const schools = member.education.split("\n").filter(Boolean);
    if (schools.length > 0) {
      person["alumniOf"] = schools.map(s => ({
        "@type": "EducationalOrganization",
        "name": s.split(",")[0]?.trim() || s,
      }));
    }
  }

  schemas.push(person);

  // Breadcrumb
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "../index.html" },
      { "@type": "ListItem", "position": 2, "name": "Our Team", "item": "team.html" },
      { "@type": "ListItem", "position": 3, "name": member.name },
    ],
  });

  return schemas.map(scriptTag).join("\n");
}

// ─── FAQ SCHEMA ───────────────────────────────────────────────────────────────

export function faqSchema(faqs: Array<{ question: string; answer: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
      },
    })),
  };
}

// ─── WEBSITE SCHEMA (sitelinks searchbox) ─────────────────────────────────────

export function websiteSchema(b: SchemaContext): string {
  return scriptTag({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": b.name,
    "description": b.description,
    ...(b.url && { "url": b.url }),
  });
}

// ─── OPEN GRAPH + TWITTER TAGS ───────────────────────────────────────────────

export function ogTags(opts: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}): string {
  const lines = [
    `<meta property="og:type" content="${opts.type || "website"}"/>`,
    `<meta property="og:title" content="${opts.title}"/>`,
    `<meta property="og:description" content="${opts.description}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${opts.title}"/>`,
    `<meta name="twitter:description" content="${opts.description}"/>`,
  ];
  if (opts.image) {
    lines.push(`<meta property="og:image" content="${opts.image}"/>`);
    lines.push(`<meta name="twitter:image" content="${opts.image}"/>`);
  }
  if (opts.url) {
    lines.push(`<meta property="og:url" content="${opts.url}"/>`);
    lines.push(`<link rel="canonical" href="${opts.url}"/>`);
  }
  return lines.join("\n");
}

// ─── SITEMAP GENERATOR ───────────────────────────────────────────────────────

export function buildSitemap(pages: Record<string, string>, baseUrl: string): string {
  const now = new Date().toISOString().split("T")[0];
  const urls = Object.keys(pages).map(page => {
    const priority =
      page === "index.html" ? "1.0" :
      page === "services.html" || page === "about.html" ? "0.9" :
      page.startsWith("services/") ? "0.8" :
      page === "contact.html" ? "0.7" : "0.6";
    return `  <url>
    <loc>${baseUrl}/${page}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page === "index.html" ? "weekly" : "monthly"}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

// ─── ROBOTS.TXT ──────────────────────────────────────────────────────────────

export function buildRobots(baseUrl: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
}
