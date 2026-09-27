export default function sitemap() {
  const baseUrl = "https://sports.kptmangaluru.in";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },

    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },

    {
      url: `${baseUrl}/results`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },

    {
      url: `${baseUrl}/certificates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}