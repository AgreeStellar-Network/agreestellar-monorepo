import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgreeStellar",
  description: "AgreeStellar App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
