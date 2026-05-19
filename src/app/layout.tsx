import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PartsPro Italia",
    template: "%s | PartsPro Italia",
  },
  description:
    "B2B and B2C platform for phone repair parts in Italy, built for fast search, stock clarity, orders, and RMA workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-slate-50 text-slate-950">{children}</body>
    </html>
  );
}
