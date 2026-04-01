const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "images.pexels.com",
    ],
  },
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/homepage-v4-light-indigo.html",
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: "launchpad",
  project: "launchpad-web",
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
  sourcemaps: {
    disable: true,
  },
});
