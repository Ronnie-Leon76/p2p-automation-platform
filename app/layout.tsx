import { MockAuthProvider } from "@/hooks/use-mock-auth";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automated P2P",
  description: "Created by the Automated P2P team",
  generator: "Next.js",
  applicationName: "Automated P2P",
  keywords: ["Automated P2P", "Next.js"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <MockAuthProvider>{children}</MockAuthProvider>
      </body>
    </html>
  );
}
