import "./globals.css";
import type { Metadata } from "next";
import { Outfit, Manrope } from "next/font/google";
import { UserProvider } from "@auth0/nextjs-auth0/client"; // Assuming you use Auth0, otherwise remove/replace

const outfit = Outfit({
  subsets: ["latin"],
  weight: ['700', '800', '900'], 
  variable: '--font-outfit',
});

const manrope = Manrope({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600'],
  variable: '--font-manrope',
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
      {/* If using Auth0 */}
      {/* <UserProvider> 
        <body
          className={`font-manrope h-full bg-gray-950 text-gray-200 selection:bg-pink-500 selection:text-white`}
          suppressHydrationWarning={true}
        >
          {children}
        </body>
      </UserProvider> */}
      {/* If not using Auth0, simplify to:*/}
      <body
        className={`font-manrope h-full bg-gray-950 text-gray-200 selection:bg-pink-500 selection:text-white`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}