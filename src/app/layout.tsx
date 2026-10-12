import type { Metadata,Viewport } from "next"; import "./globals.css";
import { PWARegister } from "@/components/pwa-register";
export const metadata:Metadata={title:{default:"Teens2Inspire — Inspiring Jewish teen girls",template:"%s | Teens2Inspire"},description:"A curated, kosher media space for Jewish girls.",applicationName:"Teens2Inspire",manifest:"/manifest.webmanifest",icons:{icon:"/icon.svg",apple:"/apple-touch-icon.png"}};
export const viewport:Viewport={themeColor:"#541c30",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<PWARegister /></body></html>}