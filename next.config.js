const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "images.pexels.com",
    ],
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
  // Disable source map upload — requires SENTRY_AUTH_TOKEN which we don't have
  sourcemaps: {
    disable: true,
  },
});
