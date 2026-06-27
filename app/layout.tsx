import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet-context";
import { InvoiceStoreProvider } from "@/lib/invoice-store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Setu — RWA Invoice Tokenization on Stellar",
  description: "Tokenize real-world invoices on Stellar Soroban. Instant liquidity for suppliers, verified yields for investors. Built on trust, powered by blockchain.",
  keywords: ["Stellar", "Soroban", "RWA", "Invoice Financing", "DeFi", "Blockchain", "Tokenization"],
  openGraph: {
    title: "Setu — Bridge Between Invoices & Liquidity",
    description: "Decentralized invoice financing platform on Stellar Soroban blockchain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="w-full min-h-full flex flex-col antialiased overflow-x-hidden" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        <WalletProvider>
          <InvoiceStoreProvider>
            {children}
          </InvoiceStoreProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
