import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dental Care - Moderní zubní klinika",
  description: "zubní klinika, krásný web s fotkou v pozadí hero sekce, mode — website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
