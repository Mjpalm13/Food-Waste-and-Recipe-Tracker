"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isSoon, LOCATIONS, soonLabel, storageAdvice, type LocationName } from "@/lib/food"
import { imageForLabel } from "@/lib/images"
import { cn } from "cn"
import { ChevronLeft } from "lucide-react"

export const tap = "h-12! rounded-xl px-4 text-base font-bold"

export const tourSpot =
  "rounded-2xl bg-[#fffdf8] p-3 shadow-[0_0_0_4px_#4a6741,0_0_0_10px_rgba(74,103,65,0.28)] outline outline-2 outline-offset-2 outline-[#c47a28]"

export function Sketch({ label, className = "" }: { label: string; className?: string }) {
  const src = imageForLabel(label)
  if (src) {
    return (
      <div className={`relative overflow-hidden rounded-xl border border-dashed border-[#b3ac9e] bg-[#efe9dc] ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      </div>
    )
  }
  return (
    <div className={`sketch flex items-center justify-center text-[#5f5b53] ${className}`}>
      <span className="note-font text-lg">{label}</span>
    </div>
  )
}

export function ExpireBadge({ days }: { days: number | null }) {
  const soon = isSoon(days)
  return (
    <Badge className={soon ? "h-6 bg-[#f6e2c6] text-[#7a3e0c]" : "h-6 bg-accent text-accent-foreground"}>
      {soonLabel(days)}
    </Badge>
  )
}

export function Header({ title, onBack, side }: { title: string; onBack?: () => void; side?: ReactNode }) {
  return (
    <div className="flex min-h-14 shrink-0 items-center gap-1 px-2">
      {onBack ? (
        <Button type="button" variant="ghost" className="size-11! px-0" onClick={onBack} aria-label="Back">
          <ChevronLeft />
        </Button>
      ) : (
        <span className="w-2" />
      )}
      {title ? <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold">{title}</h1> : <span className="min-w-0 flex-1" />}
      {side}
    </div>
  )
}

export function Scroll({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1 pb-8", className)}>{children}</div>
}

export function Screen({ children }: { children: ReactNode }) {
  return <div className="flex h-full min-h-0 flex-col">{children}</div>
}

export function LocationChips({
  value,
  onChange,
  allowEmpty = false,
}: {
  value: LocationName | null
  onChange: (location: LocationName | null) => void
  allowEmpty?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Where it goes">
      {LOCATIONS.map((location) => {
        const on = value === location
        return (
          <Button
            key={location}
            type="button"
            variant={on ? "default" : "outline"}
            aria-pressed={on}
            className="h-11! rounded-full px-3 text-sm font-semibold"
            onClick={() => onChange(on && allowEmpty ? null : location)}
          >
            {location}
          </Button>
        )
      })}
    </div>
  )
}

export function StorageTip({ name, location = null }: { name: string; location?: LocationName | null }) {
  if (!name.trim()) return null
  return <p className="rounded-xl bg-[#f6e2c6] px-3 py-2 text-sm text-[#7a3e0c]">{storageAdvice(name, location)}</p>
}

export function Stepper({
  value,
  onChange,
  label,
  min = 1,
  step = 1,
}: {
  value: number
  onChange: (value: number) => void
  label: string
  min?: number
  step?: number
}) {
  const amount = Math.max(1, step)
  return (
    <div className="flex items-center gap-3" aria-label={label}>
      <Button type="button" variant="outline" className="size-11! px-0 text-lg" onClick={() => onChange(Math.max(min, value - amount))} aria-label="Less">
        −
      </Button>
      <span className="min-w-8 text-center text-lg font-extrabold">{value}</span>
      <Button type="button" variant="outline" className="size-11! px-0 text-lg" onClick={() => onChange(value + amount)} aria-label="More">
        +
      </Button>
    </div>
  )
}

export function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  autoComplete?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        data-testid={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="h-12! text-base"
      />
      {error ? <p className="text-sm text-[#9a4a12]">{error}</p> : null}
    </div>
  )
}

export function readImage(file: File, ok: (url: string) => void, fail: () => void) {
  if (!file.type.startsWith("image/")) {
    fail()
    return
  }
  const reader = new FileReader()
  reader.onload = () => ok(String(reader.result))
  reader.onerror = fail
  reader.readAsDataURL(file)
}
