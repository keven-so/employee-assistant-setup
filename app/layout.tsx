import type { Metadata } from "next";
import { SessionWrapper } from "@/components/auth/SessionWrapper";
import "./globals.css";

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
    <html lang="en">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
