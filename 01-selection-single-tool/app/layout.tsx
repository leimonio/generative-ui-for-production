import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import "@gen-ui/talk-shell/styles.css";
import { Shell, shellMetadata } from "@gen-ui/talk-shell";

// The monday template's typeface, self-hosted by next/font.
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = shellMetadata("01");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script adds .dark to <html> before hydration.
    <html lang="en" className={`${poppins.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <Shell id="01">{children}</Shell>
      </body>
    </html>
  );
}
