import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "VyaparOS Bharat — Multi-Industry Business Operating System",
  description:
    "Modern, responsive, multi-tenant Business Operating System for Indian distributors, FMCG wholesalers, kirana stores, electronics, and retail businesses.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='25' fill='%23059669'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='55' font-weight='bold' fill='white'>V</text></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
