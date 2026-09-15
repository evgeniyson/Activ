import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")),
  title: { default: "АКТИВ — Personal Asset OS", template: "%s · АКТИВ" },
  description: "Know what your stuff is really worth. Track market value, depreciation and the true cost of everything you own.",
  applicationName: "АКТИВ",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "АКТИВ" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "АКТИВ — Personal Asset OS",
    description: "Understand what owning your stuff actually costs you.",
    images: [{ url: "/brand/og.png", width: 1200, height: 630 }],
    type: "website",
  },
  icons: { apple: "/brand/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#F9F9F9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrains.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
