const securityHeaders = [
  // Browsers must always use HTTPS for this site
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },

  // The site cannot be embedded inside another site (clickjacking)
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },

  // Browsers must not guess file types
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // Do not leak full page URLs to other sites
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // Device features this site never uses
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig = {
  poweredByHeader: false,

  allowedDevOrigins: [
    "local.sports.kptmangaluru.in",
  ],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
