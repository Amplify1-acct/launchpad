/**
 * lib/schemaGenerator.ts
 * Generates JSON-LD schema markup for customer websites.
 * Pro: LocalBusiness, Service, BreadcrumbList
 * Premium: All of the above + GeoCoordinates, areaServed, FAQPage, enhanced local signals
 */

interface Business {
  name: string;
  industry?: string;
  description?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  years_in_business?: string;
  services?: string[];
  google_maps_url?: string;
  google_rating?: number;
  google_rating_count?: number;
}

// LocalBusiness schema (Pro + Premium)
export function localBusinessSchema(biz: Business, plan: string): object {
  const base: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": biz.name,
    "description": biz.description || `${biz.name} — professional ${biz.industry || "services"} in ${biz.city || "your area"}`,
    "telephone": biz.phone || "",
    "email": biz.email || "",
    "url": biz.website || "",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": biz.city || "",
      "addressRegion": biz.state || "",
      "addressCountry": "US",
    },
    "areaServed": {
      "@type": "City",
      "name": biz.city || "",
    },
    "priceRange": "$$",
  };

  // Add rating if available
  if (biz.google_rating) {
    base["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": biz.google_rating,
      "reviewCount": biz.google_rating_count || 1,
      "bestRating": 5,
    };
  }

  // Add founding year if available
  if (biz.years_in_business) {
    const founded = new Date().getFullYear() - parseInt(biz.years_in_business);
    base["foundingDate"] = founded.toString();
  }

  // Premium: add enhanced local signals
  if (plan === "premium") {
    base["hasMap"] = biz.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent((biz.name || "") + " " + (biz.city || ""))}`;
    base["serviceArea"] = {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "addressCountry": "US",
      },
      "geoRadius": "25000", // 25km service radius
    };
    base["potentialAction"] = {
      "@type": "ReserveAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": biz.website || "",
        "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
      },
      "result": {
        "@type": "Reservation",
        "name": "Book appointment",
      },
    };
  }

  return base;
}

// Service schema for service detail pages (Pro + Premium)
export function serviceSchema(biz: Business, serviceName: string, serviceDescription: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceName,
    "description": serviceDescription || `Professional ${serviceName} services from ${biz.name}`,
    "provider": {
      "@type": "LocalBusiness",
      "name": biz.name,
      "telephone": biz.phone || "",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": biz.city || "",
        "addressRegion": biz.state || "",
        "addressCountry": "US",
      },
    },
    "areaServed": {
      "@type": "City",
      "name": biz.city || "",
    },
    "url": biz.website || "",
  };
}

// BreadcrumbList schema for inner pages (Pro + Premium)
export function breadcrumbSchema(bizName: string, bizUrl: string, pageName: string, pageUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": bizUrl },
      { "@type": "ListItem", "position": 2, "name": pageName, "item": `${bizUrl}${pageUrl}` },
    ],
  };
}

// FAQPage schema for FAQ pages (Premium)
export function faqSchema(faqs: Array<{ question: string; answer: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

// BlogPosting schema for blog posts (Pro + Premium)
export function blogPostSchema(biz: Business, post: { title: string; excerpt?: string; slug: string; published_at?: string }): object {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || "",
    "author": {
      "@type": "Organization",
      "name": biz.name,
    },
    "publisher": {
      "@type": "Organization",
      "name": biz.name,
    },
    "datePublished": post.published_at || new Date().toISOString(),
    "url": `${biz.website || ""}/blog/${post.slug}`,
  };
}

// Inject schema into HTML head (replaces or appends)
export function injectSchema(html: string, schemas: object[]): string {
  const scriptTag = `<script type="application/ld+json">${JSON.stringify(schemas.length === 1 ? schemas[0] : schemas, null, 2)}</script>`;
  if (html.includes('application/ld+json')) {
    // Replace existing schema
    return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, scriptTag);
  }
  // Inject before </head>
  return html.replace('</head>', `  ${scriptTag}
</head>`);
}
