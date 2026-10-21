import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";

import { GlobalLoadingScreen } from "@/components/global-loading-screen";

export const metadata: Metadata = {
  title: "Q-Paper",
  description: "Production-ready SaaS question paper generator"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var i = 0; i < regs.length; i++) {
                    regs[i].unregister();
                  }
                });
              }
            `
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <GlobalLoadingScreen />
        {children}
      </body>
    </html>
  );
}
