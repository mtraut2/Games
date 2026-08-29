import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppDataProvider } from "@/lib/context/AppDataContext";
import { PersonProvider } from "@/lib/context/PersonContext";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Games",
  description: "Family NYT Games leaderboard — Wordle, Connections, Strands",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Games",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <AppDataProvider>
          <PersonProvider>
            <Shell>{children}</Shell>
          </PersonProvider>
        </AppDataProvider>
      </body>
    </html>
  );
}
