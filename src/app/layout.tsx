import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "운명일지",
  description: "사주팔자 만세력 및 운세 서비스",
  openGraph: {
    title: "운명일지",
    description: "사주팔자 만세력 및 운세 서비스",
    url: "/",
    siteName: "운명일지",
    images: [{ url: "/unmyeongilji_img_512x512.png", width: 512, height: 512 }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "운명일지",
    description: "사주팔자 만세력 및 운세 서비스",
    images: ["/unmyeongilji_img_512x512.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
