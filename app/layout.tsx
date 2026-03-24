import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-fraunces",
});

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
      <body className={`${inter.variable} ${fraunces.variable}`}>
        {children}
      </body>
    </html>
  );
}
