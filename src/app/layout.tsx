import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MealPrep Manager",
  description: "Rezept-Management, Wochenplanung & Shop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
