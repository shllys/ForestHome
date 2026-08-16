import type { Metadata } from "next";

import "./globals.css";
import { CategoryProvider } from "./components/CategoryShell";
import AppShell from "./components/AppShell";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "ForestHome",
  description: "Tu plataforma para aprender a cultivar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <head>
        <link
          href="https://cdn.boxicons.com/3.0.8/fonts/basic/boxicons.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.boxicons.com/3.0.8/fonts/filled/boxicons-filled.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.boxicons.com/3.0.8/fonts/brands/boxicons-brands.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.boxicons.com/transformations.min.css"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Indie+Flower&family=Saira:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased scrollbar-hide overflow-x-hidden"
        style={{ background: "var(--bg-image)" }}
      >
        <CategoryProvider>
          <AppShell>{children}</AppShell>
        </CategoryProvider>
      </body>
    </html>
  );
}
