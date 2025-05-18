// layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Outfit, Manrope } from "next/font/google"; // Added Outfit
import { UserProvider } from "@auth0/nextjs-auth0/client";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ['700', '800', '900'], // For bold headings
  variable: '--font-outfit', // CSS Variable for headings
});

const manrope = Manrope({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600'],
  variable: '--font-manrope', // CSS Variable for body text
});

export const metadata: Metadata = {
  title: "IntellectAI",
  description:
    "10x your learning through interactive and personalized lectures, powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${manrope.variable} h-full antialiased`} suppressHydrationWarning={true}>
      <UserProvider>
        <body
          className={`font-manrope h-full bg-gray-950 text-gray-200 selection:bg-purple-500 selection:text-white`} // Use Manrope as default
          suppressHydrationWarning={true}
        >
          {children}
        </body>
      </UserProvider>
    </html>
  );
}