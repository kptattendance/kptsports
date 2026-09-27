export default function robots() {
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

    sitemap: "https://sports.kptmangaluru.in/sitemap.xml",
  };
}