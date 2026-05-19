import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgreeStellar — Decentralised Agreements on Stellar",
  description:
    "Create, accept, and manage trustless agreements powered by Soroban smart contracts on the Stellar network.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container">
            <a href="/" className="logo">
              ⭐ AgreeStellar
            </a>
            <nav>
              <a href="/">Agreements</a>
              <a href="/new">New Agreement</a>
            </nav>
          </div>
        </header>
        <main className="container main">{children}</main>
        <footer className="footer">
          <div className="container">
            <p>Powered by Soroban · Stellar Testnet</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
