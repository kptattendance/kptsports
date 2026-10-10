export default function robots() {
  const baseUrl = "https://sports.kptmangaluru.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",

        disallow: [
          "/admin/",
          "/sports-officer/",
          "/college/",
          "/student/",
          "/auth/",
          "/api/",
        ],
      },
    ],

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
