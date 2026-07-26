import type { Metadata } from "next";
import { ThemeProvider } from "@/hooks/useTheme";
import { LocaleProvider } from "@/hooks/useLocale";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PWAPrompt from "@/components/ui/PWAPrompt";
import { translate } from "@/locales";
import { getRequestLocale } from "@/locales/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: translate(locale, "meta.title"),
    description: translate(locale, "meta.description"),
    manifest: "/manifest.json",
    icons: {
      icon: "/favicon.ico",
      apple: [
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Agnes Forge",
    },
    openGraph: {
      title: translate(locale, "meta.title"),
      description: translate(locale, "meta.description"),
      type: "website",
      images: [
        {
          url: "/icons/icon-512x512.png",
          width: 512,
          height: 512,
          alt: "Agnes Forge",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: translate(locale, "meta.title"),
      description: translate(locale, "meta.description"),
      images: ["/icons/icon-512x512.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Agnes Forge" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#e85a25" />
        <meta name="msapplication-TileColor" content="#e85a25" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <Header />
            <main className="flex-1 pt-[var(--header-height)]">
              {children}
            </main>
            <Footer />
            <PWAPrompt />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
