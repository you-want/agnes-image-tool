import type { Metadata } from "next";
import { ThemeProvider } from "@/hooks/useTheme";
import { LocaleProvider } from "@/hooks/useLocale";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { translate } from "@/locales";
import { getRequestLocale } from "@/locales/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: translate(locale, "meta.title"),
    description: translate(locale, "meta.description"),
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
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <Header />
            <main className="flex-1 pt-[var(--header-height)]">
              {children}
            </main>
            <Footer />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
