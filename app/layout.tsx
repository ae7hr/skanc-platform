import type { Metadata } from "next";
import "../src/skanc.css";
export const metadata: Metadata = {
  title: "SKANC — Creative operations",
  description:
    "Clients, creative production, concerts, and people in one SKANC workspace.",
  icons: { icon: '/favicon.svg' },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
