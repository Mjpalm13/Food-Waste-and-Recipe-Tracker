"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { isSoon } from "@/lib/food"
import { useApp } from "@/lib/store"
import type { Screen } from "@/lib/types"
import { Bell, BookOpen, Home, Refrigerator, UserRound, Utensils } from "lucide-react"
import { tap } from "@/components/prototype/parts"

const TABBED = new Set<Screen>([
  "home",
  "recipes",
  "recipe",
  "pantry",
  "item",
  "edit-item",
  "add-item",
  "needs",
  "profile",
  "edit-profile",
  "notifications",
  "reminders",
  "about",
  "parts",
  "add",
  "fix-locations",
  "login",
  "meals",
])

export function Phone({ children }: { children: ReactNode }) {
  const { state, openNotice, beginReceipt, skipTour, nextTour, cancelToss, toss, cancelLogout, logout, cancelReset, reset, tab, go } = useApp()
  const showTabs = TABBED.has(state.screen)
  const bell =
    state.pantry.filter((item) => isSoon(item.daysLeft)).length + state.reminders.filter((reminder) => !reminder.done).length
  const active =
    state.screen === "recipes" || state.screen === "recipe"
      ? "recipes"
      : state.screen === "pantry" || state.screen === "item" || state.screen === "edit-item" || state.screen === "add-item" || state.screen === "needs" || state.screen === "fix-locations"
        ? "pantry"
        : state.screen === "meals" || state.screen === "log-meal" || state.screen === "meal-left"
          ? "meals"
          : state.screen === "profile" || state.screen === "edit-profile" || state.screen === "about" || state.screen === "parts" || state.screen === "login" || state.screen === "reminders" || state.screen === "notifications"
            ? "profile"
            : "home"

  return (
    <div className="mx-auto flex w-full max-w-[390px] flex-col overflow-hidden rounded-[2rem] border-[6px] border-[#2b2a27] bg-background shadow-[0_18px_50px_rgba(43,42,39,0.18)] max-sm:h-dvh max-sm:max-w-none max-sm:rounded-none max-sm:border-0 sm:h-[min(844px,calc(100dvh-5.5rem))]" data-screen={state.screen} data-testid="phone">
      <div className="flex h-11 shrink-0 items-center justify-between px-5 text-xs font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className="h-2 w-3 rounded-sm border border-current" />
          <span className="h-2.5 w-4 rounded-sm border border-current" />
        </span>
      </div>
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-dashed border-[#a39d90] bg-[#eae5da] px-2">
        <Button type="button" variant="outline" className="note-font h-9! rounded-lg border-dashed px-2 text-lg" data-testid="rough-draft" onClick={openNotice}>
          Rough draft
        </Button>
        {showTabs ? (
          <Button type="button" variant="ghost" className="relative size-9! px-0" aria-label="Notifications" onClick={() => go("notifications")}>
            <Bell className="size-5" />
            {bell > 0 ? (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9a4a12] px-1 text-[10px] font-bold text-white">{bell}</span>
            ) : null}
          </Button>
        ) : null}
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-hidden">{state.ready ? children : <p className="p-6 text-sm">Opening the draft…</p>}</div>
        {state.ready && state.showNotice ? (
          <Modal label="Pantry Pal">
            <h2 className="text-center text-xl font-extrabold">Pantry Pal</h2>
            <p className="text-center text-sm">Manage your food with ease so less of it goes to waste!</p>
            <Button type="button" className={tap} data-testid="notice-start" onClick={beginReceipt}>
              Add a receipt
            </Button>
          </Modal>
        ) : null}
        {state.ready && state.tourStep > 0 && state.screen === "home" ? (
          <TourSheet>
            <p className="text-xs font-bold text-muted-foreground">Look around · {state.tourStep} of 5</p>
            <h2 className="text-xl font-extrabold">
              {state.tourStep === 1
                ? "Welcome!"
                : state.tourStep === 2
                  ? "Eat this soon"
                  : state.tourStep === 3
                    ? "A recipe from that food"
                    : state.tourStep === 4
                      ? "Manage the details"
                      : "What you ate"}
            </h2>
            <p className="text-sm">
              {state.tourStep === 1
                ? "This is a quick tour around the Pantry Pal app so you know where everything lives."
                : state.tourStep === 2
                  ? "Food closest to going bad is the first thing on Home. Tap one when you want the details."
                  : state.tourStep === 3
                    ? "This recipe uses what is expiring. Open it from here, from Recipes, or from the food itself."
                    : state.tourStep === 4
                      ? "Pantry is where you change a count, a date, or where something sits. Reminders live in the bell."
                      : "Meals is where you log what you ate. We ask how much of each food is left."}
            </p>
            <Button type="button" className={tap} data-testid="tour-next" onClick={nextTour}>
              {state.tourStep === 5 ? "Done" : "Next"}
            </Button>
            <Button type="button" variant="ghost" className="h-11! font-semibold" data-testid="skip-tour" onClick={skipTour}>
              Skip the tour
            </Button>
          </TourSheet>
        ) : null}
        {state.ready && state.pendingToss ? (
          <Modal label="Toss this food">
            <h2 className="text-xl font-extrabold">Toss this?</h2>
            <p className="text-sm">It leaves the pantry. We use that to remind you sooner next time.</p>
            <Button type="button" className={tap} onClick={toss}>Toss it</Button>
            <Button type="button" variant="outline" className={tap} onClick={cancelToss}>Keep it</Button>
          </Modal>
        ) : null}
        {state.ready && state.confirmLogout ? (
          <Modal label="Log out">
            <h2 className="text-xl font-extrabold">Log out?</h2>
            <p className="text-sm">The pantry stays on this phone. You can log back in.</p>
            <Button type="button" className={tap} data-testid="confirm-logout" onClick={logout}>Log out</Button>
            <Button type="button" variant="outline" className={tap} onClick={cancelLogout}>Stay logged in</Button>
          </Modal>
        ) : null}
        {state.ready && state.confirmReset ? (
          <Modal label="Reset draft">
            <h2 className="text-xl font-extrabold">Start the draft over?</h2>
            <p className="text-sm">This clears the pantry, the account, and the goal on this phone.</p>
            <Button type="button" className={tap} data-testid="confirm-reset" onClick={reset}>Reset</Button>
            <Button type="button" variant="outline" className={tap} onClick={cancelReset}>Cancel</Button>
          </Modal>
        ) : null}
        {state.toast ? (
          <div className="absolute top-3 right-3 left-3 z-40 rounded-xl bg-[#2b2a27] px-4 py-3 text-sm font-semibold text-white" role="status">
            {state.toast}
          </div>
        ) : null}
      </div>
      {showTabs ? (
        <nav className="grid shrink-0 grid-cols-5 border-t border-border bg-[#fbf9f4] px-1 pt-1 pb-3" aria-label="Main">
          <Tab icon={<Home />} label="Home" on={active === "home"} onClick={() => tab("home")} testid="tab-home" />
          <Tab icon={<BookOpen />} label="Recipes" on={active === "recipes"} onClick={() => tab("recipes")} testid="tab-recipes" />
          <Tab icon={<Refrigerator />} label="Pantry" on={active === "pantry"} onClick={() => tab("pantry")} testid="tab-pantry" tour={state.tourStep === 4} />
          <Tab icon={<Utensils />} label="Meals" on={active === "meals"} onClick={() => tab("meals")} testid="tab-meals" tour={state.tourStep === 5} />
          <Tab icon={<UserRound />} label="Profile" on={active === "profile"} onClick={() => tab("profile")} testid="tab-profile" />
        </nav>
      ) : (
        <div className="h-6 shrink-0" />
      )}
    </div>
  )
}

function Tab({
  icon,
  label,
  on,
  onClick,
  testid,
  tour = false,
}: {
  icon: ReactNode
  label: string
  on: boolean
  onClick: () => void
  testid: string
  tour?: boolean
}) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      aria-current={on ? "page" : undefined}
      className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-bold transition-colors ${
        tour
          ? "bg-[#fffdf8] text-primary shadow-[0_0_0_3px_#4a6741,0_0_0_7px_rgba(74,103,65,0.28)]"
          : on
            ? "bg-[#dce6d8] text-primary [&_svg]:stroke-[2.75]"
            : "text-[#6a665e]"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function Modal({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#2b2a27]/65 p-4 backdrop-blur-[8px]" role="dialog" aria-modal="true" aria-label={label}>
      <div className="flex max-h-full w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-foreground bg-popover p-5">{children}</div>
    </div>
  )
}

function TourSheet({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-end" role="dialog" aria-modal="true" aria-label="Tour">
      <div className="pointer-events-auto flex max-h-[38%] w-full flex-col gap-3 overflow-y-auto rounded-t-2xl border border-foreground bg-popover p-5 shadow-[0_-12px_28px_rgba(43,42,39,0.16)]">
        <div className="mx-auto h-1 w-10 rounded-full bg-[#bdb6a8]" />
        {children}
      </div>
    </div>
  )
}

