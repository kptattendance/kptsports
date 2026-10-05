import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://sports.kptmangaluru.in"),

  title: {
    default: "KPT Sports Meet",
    template: "%s | KPT Sports Meet",
  },

  description:
    "KPT Sports Meet Management System for online sports registration, event management, participant applications, results and certificates.",

  applicationName: "KPT Sports Meet",

  keywords: [
    "KPT Sports Meet",
    "KPT Mangaluru Sports Meet",
    "Karnataka Polytechnic Sports Meet",
    "Polytechnic Sports Meet",
    "Karnataka Polytechnic Sports",
    "Diploma Students Sports Meet",
    "Karnataka Polytechnic Sports",
    "KPT Sports Registration",
    "Sports Meet Registration",
    "Sports Event Registration",
    "College Sports Meet",
    "Polytechnic Sports Registration",
    "Student Sports Registration",
    "Sports Meet Results",
    "Sports Meet Certificate",
    "Sports Event Results",
    "Athletics Meet",
    "College Athletics",
    "Polytechnic Athletics",
    "Inter Polytechnic Sports",
    "Karnataka Polytechnic",
    "Mangaluru Sports",
    "Karnataka Sports Meet",
  ],

  authors: [
    {
      name: "Karnataka Government Polytechnic Mangaluru",
    },
  ],

  creator: "Karnataka Government Polytechnic Mangaluru",

  publisher: "Karnataka Government Polytechnic Mangaluru",

  category: "Sports",

  alternates: {
    canonical: "https://sports.kptmangaluru.in",
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://sports.kptmangaluru.in",
    siteName: "KPT Sports Meet",
    title: "KPT Sports Meet",
    description:
      "Online sports registration, event management, results and certificates for KPT Sports Meet.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KPT Sports Meet",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "KPT Sports Meet",
    description:
      "KPT Sports Meet Management System for sports registration, events, results and certificates.",
    images: ["/og-image.jpg"],
  },

  verification: {
  google: "O67tWHY9xLUtBxSrAxCliKSiLNqr1KiTwmd_uKb_iVA",
},

 
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en-IN">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}