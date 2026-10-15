import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Volkswagen HSK 63 • Control de Herramientas",
  description: "Sistema de digitalización y cotejo de cartoncillos HSK 63 - Volkswagen de México",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof window !== 'undefined') {
                    window.addEventListener('error', function(e) {
                      if (e && e.message && (e.message.indexOf('ethereum') !== -1 || e.message.indexOf('selectedAddress') !== -1)) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                      }
                    }, true);
                    window.addEventListener('unhandledrejection', function(e) {
                      var reason = '' + (e && (e.reason ? (e.reason.message || e.reason) : ''));
                      if (reason.indexOf('ethereum') !== -1 || reason.indexOf('selectedAddress') !== -1) {
                        e.preventDefault();
                      }
                    });
                  }
                } catch(err) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
