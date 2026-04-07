import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { SteamNotificationContainer } from "@/utils/SteamNotification";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "VTUBER FANHUB",
  icons: {
    icon: "/La_Creatura.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className}>
        <div className="noir-container"><div className="noir-tv-overlay"></div></div>
        <SteamNotificationContainer />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
