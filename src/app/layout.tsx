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
  metadataBase: new URL("https://un-myeong-il-ji.vercel.app"),
  title: "운명일지",
  description: "사주팔자 만세력 및 운세 서비스",
  openGraph: {
    title: "운명일지",
    description:
      "사주 볼 때마다 다른 말 하는 사람 말고, 데이터로 보는 내 운명.",
    url: "/",
    siteName: "운명일지",
    images: [{ url: "/opengraph-image.png.png", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "운명일지",
    description:
      "사주 볼 때마다 다른 말 하는 사람 말고, 데이터로 보는 내 운명.",
    images: ["/opengraph-image.png.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
