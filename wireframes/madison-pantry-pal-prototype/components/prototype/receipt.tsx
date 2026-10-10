"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SAMPLE_LINES, soonLabel } from "@/lib/food"
import { useApp } from "@/lib/store"
import { Camera, ImagePlus, ReceiptText } from "lucide-react"
import { ExpireBadge, Field, Header, LocationChips, readImage, Screen, Scroll, Sketch, Stepper, tap } from "@/components/prototype/parts"

export function SampleReceipt() {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  return (
    <div className="mx-auto w-full max-w-[280px] rotate-[-1.5deg] rounded-sm bg-[#f7f3e8] px-4 py-5 text-[#2b2a27] shadow-[0_8px_24px_rgba(43,42,39,0.12)]" aria-label="Sample grocery receipt">
      <div className="text-center">
        <p className="text-lg font-black tracking-wide">FRESH MART</p>
        <p className="text-xs">142 College Ave</p>
        <p className="text-xs">{today} · 6:12 PM</p>
      </div>
      <div className="my-3 border-t border-dashed border-[#8c867a]" />
      <ul className="space-y-1.5 font-mono text-[13px]">
        {SAMPLE_LINES.map((line) => (
          <li key={line.raw} className="flex justify-between gap-3">
            <span>{line.raw}</span>
            <span>{line.price}</span>
          </li>
        ))}
        <li className="flex justify-between gap-3 border-t border-dashed border-[#8c867a] pt-1.5 font-bold">
          <span>TOTAL</span>
          <span>24.19</span>
        </li>
      </ul>
      <div className="mt-4 flex h-10 items-end justify-center gap-px" aria-hidden="true">
        {Array.from({ length: 42 }).map((_, index) => (
          <span key={index} className="bg-[#2b2a27]" style={{ width: index % 4 === 0 ? 2 : 1, height: 18 + (index % 5) * 3 }} />
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] tracking-widest">CARD 4821</p>
    </div>
  )
}

function ChoiceButtons() {
  const { go } = useApp()
  return (
    <div className="flex flex-col gap-3">
      <Button type="button" className={tap} data-testid="take-photo" onClick={() => go("camera")}>
        <Camera /> Take a photo
      </Button>
      <Button type="button" variant="outline" className={tap} data-testid="upload-photo" onClick={() => go("upload")}>
        <ImagePlus /> Upload a picture
      </Button>
      <Button type="button" variant="outline" className={tap} data-testid="sample-receipt" onClick={() => go("sample")}>
        <ReceiptText /> Use the sample receipt
      </Button>
    </div>
  )
}

export function ValueScreen() {
  const { state, lookAround, back } = useApp()
  const adding = state.screen === "add"
  return (
    <Screen>
      <Header title={adding ? "Add a receipt" : "Pantry Pal"} onBack={adding ? back : undefined} />
      <Scroll>
        <Sketch label="receipt" className="h-28" />
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl leading-tight font-extrabold">See what you have. Eat it before it goes bad.</h2>
          <p className="text-base text-[#4a463f]">Photograph a receipt. We turn the lines into your pantry and show you what to use first.</p>
        </div>
        <ChoiceButtons />
        {adding ? null : (
          <Button type="button" variant="ghost" className="h-11! text-base font-semibold" data-testid="look-around" onClick={lookAround}>
            Look around first
          </Button>
        )}
      </Scroll>
    </Screen>
  )
}

export function CameraScreen() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const { back, setPhoto, beginRead, go } = useApp()

  useEffect(() => {
    let stopped = false
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This device has no camera. Choose a picture, or use the sample receipt.")
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setLive(true)
      } catch {
        setError("The camera did not open. Choose a picture, or use the sample receipt.")
      }
    }
    void start()
    return () => {
      stopped = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function keepShot(url: string) {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setPhoto(url, "camera")
    beginRead()
  }

  function capture() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 960
    const context = canvas.getContext("2d")
    if (!context) return
    context.drawImage(video, 0, 0)
    keepShot(canvas.toDataURL("image/jpeg", 0.85))
  }

  return (
    <Screen>
      <Header title="Take a photo" onBack={back} />
      <Scroll>
        <div className="overflow-hidden rounded-2xl border border-dashed border-[#8c867a] bg-[#3a3833]">
          <video ref={videoRef} className={live ? "aspect-[3/4] w-full object-cover" : "hidden"} playsInline muted />
          {live ? null : <Sketch label={error ? "no camera" : "opening camera"} className="aspect-[3/4] rounded-none border-0 bg-transparent text-[#eae5da]" />}
        </div>
        {error ? <p className="text-sm text-[#7a3e0c]">{error}</p> : <p className="text-sm text-muted-foreground">Line the receipt up, then take the photo. Your picture stays on the next screen.</p>}
        {live ? (
          <Button type="button" className={tap} data-testid="shutter" onClick={capture}>
            Use this shot
          </Button>
        ) : null}
        <Button type="button" variant="outline" className={tap} onClick={() => fileRef.current?.click()}>
          Choose a picture
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            readImage(file, keepShot, () => setError("Choose a picture of a receipt."))
          }}
        />
        <Button type="button" variant="ghost" className="h-11! font-semibold" onClick={() => go("sample")}>
          Use the sample receipt instead
        </Button>
      </Scroll>
    </Screen>
  )
}

export function UploadScreen() {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { back, setPhoto, beginRead, go } = useApp()

  return (
    <Screen>
      <Header title="Upload a picture" onBack={back} />
      <Scroll>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Receipt you chose" className="max-h-72 w-full rounded-2xl border border-dashed border-[#b3ac9e] object-contain" />
        ) : (
          <Sketch label="your picture" className="h-48" />
        )}
        {error ? <p className="text-sm text-[#7a3e0c]">{error}</p> : <p className="text-sm text-muted-foreground">Pick a photo from this device. We keep it on the next screen while the practice reader fills the list.</p>}
        <Button type="button" className={tap} data-testid="choose-file" onClick={() => fileRef.current?.click()}>
          Choose a picture
        </Button>
        <input
          ref={fileRef}
          data-testid="file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            readImage(
              file,
              (url) => {
                setPreview(url)
                setError(null)
              },
              () => setError("That file is not a picture.")
            )
          }}
        />
        <Button
          type="button"
          className={tap}
          disabled={!preview}
          data-testid="use-upload"
          onClick={() => {
            if (!preview) return
            setPhoto(preview, "upload")
            beginRead()
          }}
        >
          Read this picture
        </Button>
        <Button type="button" variant="ghost" className="h-11! font-semibold" onClick={() => go("sample")}>
          Use the sample receipt instead
        </Button>
      </Scroll>
    </Screen>
  )
}

export function SampleScreen() {
  const { back, setPhoto, beginRead } = useApp()
  return (
    <Screen>
      <Header title="Sample receipt" onBack={back} />
      <Scroll>
        <p className="text-sm text-muted-foreground">This practice receipt has foods we know, bananas that need a count, a code we cannot read, and a tax line we ignore.</p>
        <SampleReceipt />
        <Button
          type="button"
          className={tap}
          data-testid="read-sample"
          onClick={() => {
            setPhoto("sample", "sample")
            beginRead()
          }}
        >
          Read this receipt
        </Button>
      </Scroll>
    </Screen>
  )
}

export function ReadingScreen() {
  const { finishRead, state, back } = useApp()
  useEffect(() => {
    const timer = setTimeout(() => finishRead(), 900)
    return () => clearTimeout(timer)
  }, [finishRead])
  return (
    <Screen>
      <Header title="Reading" onBack={back} />
      <Scroll>
        {state.photo && state.photo !== "sample" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.photo} alt="Receipt being read" className="max-h-48 w-full rounded-2xl object-contain" />
        ) : (
          <SampleReceipt />
        )}
        <h2 className="text-2xl font-extrabold">Matching store codes to foods…</h2>
        <p className="text-sm text-muted-foreground">Usual keep times are filled in when we know the food.</p>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-2/3 animate-pulse bg-primary" />
        </div>
      </Scroll>
    </Screen>
  )
}

export function ReviewScreen() {
  const { state, back, toggleLine, continueReview } = useApp()
  const foods = state.draft.filter((line) => line.kind !== "ignored")
  const kept = foods.some((line) => line.include)
  return (
    <Screen>
      <Header title="Check the foods" onBack={back} />
      <Scroll>
        {state.photo && state.photo !== "sample" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.photo} alt="Your receipt photo" className="max-h-40 w-full rounded-2xl border border-dashed object-contain" />
        ) : null}
        <p className="text-sm text-muted-foreground">
          Practice reader: this draft matches the receipt to a stored grocery list. Uncheck anything you did not buy. Tax was left off.
        </p>
        <ul className="flex flex-col gap-2">
          {foods.map((line) => (
            <li key={line.id} className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-card p-3">
              <Checkbox checked={line.include} onCheckedChange={() => toggleLine(line.id)} aria-label={`Include ${line.name || line.raw}`} className="mt-1 size-5" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{line.needsName ? "Needs a name" : line.name}</p>
                <p className="text-xs text-muted-foreground">{line.raw} · ${line.price}</p>
                <div className="mt-2">
                  {line.needsQuantity ? <BadgeLike>Needs a count</BadgeLike> : <ExpireBadge days={line.days} />}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {kept ? null : <p className="text-sm text-muted-foreground">Keep at least one food.</p>}
      </Scroll>
      <div className="shrink-0 border-t border-border px-5 py-3">
        <Button type="button" className={tap} disabled={!kept} data-testid="continue-review" onClick={continueReview}>
          Continue
        </Button>
      </div>
    </Screen>
  )
}

function BadgeLike({ children }: { children: string }) {
  return <span className="inline-flex h-6 items-center rounded-full bg-[#f6e2c6] px-2 text-xs font-medium text-[#7a3e0c]">{children}</span>
}

export function UnknownScreen() {
  const { state, back, saveUnknown, deferUnknown } = useApp()
  const line = state.draft.find((item) => item.id === state.promptId)
  const [name, setName] = useState("")
  if (!line) return null
  return (
    <Screen>
      <Header title="We could not read this" onBack={back} />
      <Scroll>
        <Sketch label="code" className="h-24" />
        <h2 className="text-2xl font-extrabold">{line.raw}</h2>
        <p className="text-sm text-muted-foreground">This store code is not in the list. Name the food now, or leave it for later. You cannot pass it by accident.</p>
        <Field id="unknown-name" label="What food is it?" value={name} onChange={setName} />
        <Button type="button" className={tap} disabled={!name.trim()} data-testid="save-unknown" onClick={() => saveUnknown(name)}>
          Save this name
        </Button>
        <Button type="button" variant="outline" className={tap} data-testid="later-unknown" onClick={deferUnknown}>
          Decide later
        </Button>
      </Scroll>
    </Screen>
  )
}

export function ProduceScreen() {
  const { state, back, saveProduce, deferProduce } = useApp()
  const line = state.draft.find((item) => item.id === state.promptId)
  const [qty, setQty] = useState(3)
  if (!line) return null
  return (
    <Screen>
      <Header title="How many?" onBack={back} />
      <Scroll>
        <Sketch label={line.name.toLowerCase()} className="h-28" />
        <h2 className="text-2xl font-extrabold">{line.name}</h2>
        <p className="text-sm text-muted-foreground">
          Produce does not say a count on the receipt. {line.name} usually keep about {soonLabel(line.days).toLowerCase()}.
        </p>
        <Stepper value={qty} onChange={setQty} label={`How many ${line.name}`} />
        <Button type="button" className={tap} data-testid="save-produce" onClick={() => saveProduce(qty)}>
          Save count
        </Button>
        <Button type="button" variant="outline" className={tap} data-testid="later-produce" onClick={deferProduce}>
          I&apos;ll count later
        </Button>
      </Scroll>
    </Screen>
  )
}

export function LocationScreen() {
  const { state, back, setDraftLocation, savePlaces, skipPlaces, go } = useApp()
  const lines = state.draft.filter((line) => line.include && line.kind !== "ignored")
  return (
    <Screen>
      <Header title="Where does it go?" onBack={back} />
      <Scroll>
        <p className="text-sm text-muted-foreground">A place makes food easier to find in a shared kitchen. Skip this, or set a reminder and do it later.</p>
        <ul className="flex flex-col gap-4">
          {lines.map((line) => (
            <li key={line.id} className="flex flex-col gap-2">
              <p className="font-bold">{line.name}</p>
              <LocationChips value={line.location} allowEmpty onChange={(location) => setDraftLocation(line.id, location)} />
            </li>
          ))}
        </ul>
      </Scroll>
      <div className="flex shrink-0 flex-col gap-2 border-t border-border px-5 py-3">
        <Button type="button" className={tap} data-testid="save-places" onClick={savePlaces}>
          Save places
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-12! font-bold" data-testid="skip-places" onClick={skipPlaces}>
            Skip
          </Button>
          <Button type="button" variant="outline" className="h-12! font-bold" data-testid="remind-later" onClick={() => go("remind-when")}>
            Remind me
          </Button>
        </div>
      </div>
    </Screen>
  )
}

export function RemindScreen() {
  const { back, remindLater } = useApp()
  const options = ["Tonight", "Tomorrow morning", "This weekend"] as const
  return (
    <Screen>
      <Header title="When should we remind you?" onBack={back} />
      <Scroll>
        <p className="text-sm text-muted-foreground">We&apos;ll put it on your home screen and in the bell. The food is still added now.</p>
        {options.map((when) => (
          <Button key={when} type="button" variant="outline" className={tap} data-testid={`when-${when.split(" ")[0].toLowerCase()}`} onClick={() => remindLater(when)}>
            {when}
          </Button>
        ))}
      </Scroll>
    </Screen>
  )
}

export function AddedScreen() {
  const { state, go, skipAccount, goKitchen } = useApp()
  return (
    <Screen>
      <Header title="In your pantry" />
      <Scroll>
        <Sketch label="kitchen" className="h-28" />
        <h2 className="text-3xl font-extrabold">{state.addedCount} foods added.</h2>
        <p className="text-base text-[#4a463f]">
          {state.soonestName ? `${state.soonestName} should be eaten first.` : "Nothing is close to expiring yet."} You can still fill in a missing name, count, or place.
        </p>
        {state.session ? (
          <Button type="button" className={tap} data-testid="see-kitchen" onClick={goKitchen}>
            See what to eat
          </Button>
        ) : (
          <>
            <Button type="button" className={tap} data-testid="make-account" onClick={() => go("account")}>
              Make an account
            </Button>
            <Button type="button" variant="outline" className={tap} data-testid="skip-account" onClick={skipAccount}>
              Skip for now
            </Button>
          </>
        )}
      </Scroll>
    </Screen>
  )
}

export function AccountScreen() {
  const { state, back, createAccount, skipAccount } = useApp()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const onboarding = state.stack.some((frame) => frame.screen === "added")

  function submit() {
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = "Tell us what to call you."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter an email like name@school.edu."
    if (password.length < 8) next.password = "Use at least 8 characters."
    setErrors(next)
    if (Object.keys(next).length) return
    createAccount({ name: name.trim(), email: email.trim(), password })
  }

  return (
    <Screen>
      <Header title="Make an account" onBack={back} />
      <Scroll>
        <p className="text-sm text-muted-foreground">One name, an email, and a password. It stays on this phone. You can skip and make it later from Profile.</p>
        <Field id="account-name" label="Name" value={name} onChange={setName} error={errors.name} autoComplete="name" />
        <Field id="account-email" label="Email" value={email} onChange={setEmail} error={errors.email} type="email" autoComplete="email" />
        <Field id="account-password" label="Password" value={password} onChange={setPassword} error={errors.password} type={show ? "text" : "password"} autoComplete="new-password" />
        <Button type="button" variant="ghost" className="h-11! self-start px-0 font-semibold" onClick={() => setShow((value) => !value)}>
          {show ? "Hide password" : "Show password"}
        </Button>
        <Button type="button" className={tap} data-testid="create-account" onClick={submit}>
          Create account
        </Button>
        {onboarding ? (
          <Button type="button" variant="outline" className={tap} data-testid="skip-account-form" onClick={skipAccount}>
            Skip for now
          </Button>
        ) : null}
      </Scroll>
    </Screen>
  )
}

export function LoginScreen() {
  const { back, login } = useApp()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  return (
    <Screen>
      <Header title="Log in" onBack={back} />
      <Scroll>
        <p className="text-sm text-muted-foreground">Use the email and password you saved on this phone.</p>
        <Field id="login-email" label="Email" value={email} onChange={setEmail} type="email" />
        <Field id="login-password" label="Password" value={password} onChange={setPassword} type="password" />
        {error ? <p className="text-sm text-[#9a4a12]">{error}</p> : null}
        <Button
          type="button"
          className={tap}
          data-testid="login-submit"
          onClick={() => {
            const ok = login(email, password)
            if (!ok) setError("That email and password do not match this phone.")
          }}
        >
          Log in
        </Button>
      </Scroll>
    </Screen>
  )
}
