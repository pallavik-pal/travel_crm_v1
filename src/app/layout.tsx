import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prapancha Pravasa Tours ",
  description: "Modern CRM for managing group tours, bookings, payments, and operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
