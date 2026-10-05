export default function robots() {
  const baseUrl = "https://sports.kptmangaluru.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",

        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/auth/",
          "/login/",
        ],
      },
    ],

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}