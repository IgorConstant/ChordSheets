import type { Metadata } from "next";
import { Merriweather, Righteous } from "next/font/google";
import "./globals.css";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const righteous = Righteous({
  variable: "--font-righteous",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "cifras | o som do silêncio",
  description: "Gere cifras limpas, sem anúncios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={`${merriweather.variable} ${righteous.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-800">{children}</body>
    </html>
  );
}
