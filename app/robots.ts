import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/dev/",
          "/auth/",
          "/checkout/",
          "/success/",
          "/sites/",
        ],
      },
    ],
    sitemap: "https://www.exsisto.ai/sitemap.xml",
    host: "https://www.exsisto.ai",
  };
}
