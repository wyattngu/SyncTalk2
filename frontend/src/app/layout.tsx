import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/navbar";
import { LayoutShell } from "@/components/layout/layout-shell";
import { AuthHydrator } from "@/components/auth/auth-hydrator";
import { NotificationCountProvider } from "@/hooks/use-notification-count";
import { PresenceProvider } from "@/components/presence/presence-provider";
import { AIChatWidget } from "@/components/ai/ai-chat-widget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SyncTalk",
  description: "Modern real-time communication platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Material Symbols Outlined */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} antialiased`}
      >
        <AuthHydrator />
        <PresenceProvider>
          <NotificationCountProvider>
            <LayoutShell navbar={<Navbar />}>{children}</LayoutShell>
            <AIChatWidget />
            <Toaster position="top-right" richColors />
          </NotificationCountProvider>
        </PresenceProvider>
      </body>
    </html>
  );
}
