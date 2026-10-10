import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Caveat, Figtree } from "next/font/google"
import "./globals.css"

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
})

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
})

export const metadata: Metadata = {
  title: "Pantry Pal — rough draft",
  description: "A low-fidelity phone prototype for seeing what food you have and what to eat before it expires.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${caveat.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
