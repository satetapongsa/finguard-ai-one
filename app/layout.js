import { IBM_Plex_Sans_Thai } from "next/font/google";
import { LangProvider } from "./i18n";
import "./globals.css";

const plex = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600"], display: "swap" });

export const metadata = {
  title: "FinGuard AI – ตรวจประกาศ ธปท. กับ policy ภายใน",
  description: "Regulatory Compliance Agent สำหรับทีม Compliance"
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={plex.className}><LangProvider>{children}</LangProvider></body>
    </html>
  );
}
