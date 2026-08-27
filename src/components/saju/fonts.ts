import {
  Gowun_Batang,
  IBM_Plex_Mono,
  IBM_Plex_Sans_KR,
  Nanum_Myeongjo,
} from "next/font/google";

export const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-myeongjo",
  display: "swap",
});

export const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-batang",
  display: "swap",
});

export const plexSansKr = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-plex-sans",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const sajuFontVariables = [
  nanumMyeongjo.variable,
  gowunBatang.variable,
  plexSansKr.variable,
  plexMono.variable,
].join(" ");
