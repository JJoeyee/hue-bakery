import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hue Bakery · 会烘焙 | Slow-Fermentation Oubao",
  description: "Fresh slow-fermentation Oubao from Hue Bakery 会烘焙, with West Malaysia delivery and online order checkout.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
