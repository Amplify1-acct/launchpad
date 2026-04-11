import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started — Exsisto | Done-For-You Digital Presence",
  description: "Choose your plan and get your professional website, weekly blog posts, and social media handled for you. Starting at $99/month.",
  alternates: {
    canonical: "https://www.exsisto.ai/order",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Get Started with Exsisto",
    description: "Professional website + weekly content + social media — done for you. Starting at $99/month.",
    url: "https://www.exsisto.ai/order",
    type: "website",
    siteName: "Exsisto",
  },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
