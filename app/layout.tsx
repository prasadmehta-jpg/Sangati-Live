import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sangati | One AI. Total Harmony.",
  description: "One AI. Total Harmony.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
