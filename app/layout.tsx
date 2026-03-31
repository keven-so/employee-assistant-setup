import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionWrapper } from "@/components/auth/SessionWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Employee Assistant",
  description: "AI-powered employee assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
