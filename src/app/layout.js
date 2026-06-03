import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Nota Builder Pro — Dashboard",
  description: "Buat nota, invoice, struk, dan kwitansi profesional dengan mudah dan cepat.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${outfit.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
