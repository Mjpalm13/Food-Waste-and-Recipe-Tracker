"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ExpireBadge, LocationChips, Sketch, tap } from "@/components/prototype/parts"

export default function LibraryPage() {
  return (
    <main className="min-h-dvh bg-[#e4ddd0] px-6 py-10 text-[#2b2a27]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="note-font text-2xl text-[#5a554c]">Rough draft · parts</p>
            <h1 className="text-4xl font-extrabold">Pantry Pal design library</h1>
            <p className="mt-2 max-w-2xl text-[#4a463f]">
              The phone prototype reuses these pieces. Sage is the one main action. Amber only means the food should be eaten soon. Caveat is for draft notes, not the product voice.
            </p>
          </div>
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-4 text-base font-bold">
            Back to the phone
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="gap-3 border border-dashed bg-card py-4 shadow-none ring-0">
            <h2 className="px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">Buttons</h2>
            <div className="flex flex-col gap-2 px-4">
              <Button type="button" className={tap}>Primary · one per screen</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="h-12! flex-1 font-bold">Secondary</Button>
                <Button type="button" variant="ghost" className="h-12! flex-1 font-bold">Text</Button>
              </div>
            </div>
          </Card>
          <Card className="gap-3 border border-dashed bg-card py-4 shadow-none ring-0">
            <h2 className="px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">Food status</h2>
            <div className="flex flex-wrap gap-2 px-4">
              <ExpireBadge days={1} />
              <ExpireBadge days={3} />
              <ExpireBadge days={12} />
              <Badge className="h-6 bg-[#f6e2c6] text-[#7a3e0c]">Needs a count</Badge>
            </div>
            <div className="px-4">
              <Sketch label="photo" className="h-24" />
            </div>
          </Card>
          <Card className="gap-3 border border-dashed bg-card py-4 shadow-none ring-0">
            <h2 className="px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">Where it goes</h2>
            <div className="px-4">
              <LocationChips value="Fridge" onChange={() => undefined} />
            </div>
            <div className="flex items-center gap-3 px-4">
              <Checkbox checked aria-label="Included example" />
              <span className="text-sm">Include this line from the receipt</span>
            </div>
          </Card>
          <Card className="gap-3 border border-dashed bg-card py-4 shadow-none ring-0">
            <h2 className="px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">Account field</h2>
            <div className="flex flex-col gap-2 px-4">
              <Label htmlFor="lib-email">Email</Label>
              <Input id="lib-email" placeholder="name@school.edu" className="h-12! text-base" readOnly />
              <Separator />
              <p className="note-font text-xl text-[#5a554c]">Handwritten notes are for the draft, not for food names.</p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
