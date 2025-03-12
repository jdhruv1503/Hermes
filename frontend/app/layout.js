import { Inter_Tight } from "next/font/google";
import { Libre_Caslon_Text } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const libreCaslon = Libre_Caslon_Text({
  variable: "--font-serif",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Kernel",
  description: "Kernel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interTight.variable} ${libreCaslon.variable} antialiased font-sans`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
