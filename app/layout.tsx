import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exsisto — Your business, brought to life.",
  description:
    "Stop doing it yourself. We build your website, write your blog posts, and handle your social media every week — you just run your business.",
  openGraph: {
    title: "Exsisto — Your business, brought to life.",
    description:
      "Your website built, your blog written, your social media posted — done for you every week.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
