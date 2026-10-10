"use client"

import dynamic from "next/dynamic"

const PrototypeApp = dynamic(() => import("@/components/prototype/app"), { ssr: false })

export default function Home() {
  return <PrototypeApp />
}
