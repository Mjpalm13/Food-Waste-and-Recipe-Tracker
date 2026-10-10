"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import type { Screen } from "@/lib/types"
import { BookOpen, Flag, Home, Refrigerator, UserRound, Utensils } from "lucide-react"
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
  const { state, openNotice, openGoal, closeNotice, lookAround, closeGoal, closeGoalDone, skipTour, nextTour, cancelToss, toss, cancelLogout, logout, cancelReset, reset, go, tab } = useApp()
  const done = [state.goal.addedReceipt, state.goal.openedSoon, state.goal.openedRecipe].filter(Boolean).length
  const showTabs = TABBED.has(state.screen)
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
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-dashed border-[#a39d90] bg-[#eae5da] px-2">
        <Button type="button" variant="outline" className="note-font h-9! rounded-lg border-dashed px-2 text-lg" data-testid="rough-draft" onClick={openNotice}>
          Rough draft
        </Button>
        <Button type="button" variant="ghost" className="h-10! px-2 text-sm font-bold text-primary" data-testid="goal-button" onClick={openGoal}>
          <Flag className="size-4" /> Goal: {done} of 3
        </Button>
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-hidden">{state.ready ? children : <p className="p-6 text-sm">Opening the draft…</p>}</div>
        {state.ready && state.showNotice ? (
          <Modal label="This is a rough draft">
            <p className="note-font text-2xl text-[#5a554c]">Rough draft</p>
            <h2 className="text-xl font-extrabold">This is an early sketch, not the finished app.</h2>
            <p className="text-sm">Boxes stand in for photos. The receipt reader uses a practice grocery list so every step can be tried, including a food we know, produce that needs a count, and a code we cannot read.</p>
            <div className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">
              <b>Your goal:</b> add food from a receipt, open something that is about to go bad, and open a recipe that uses it. There is more than one way to do that.
            </div>
            <Button type="button" className={tap} data-testid="notice-start" onClick={closeNotice}>
              Add a receipt
            </Button>
            <Button type="button" variant="outline" className={tap} data-testid="notice-look" onClick={lookAround}>
              Look around first
            </Button>
          </Modal>
        ) : null}
        {state.ready && state.showGoal ? (
          <Sheet label="Your goal" onClose={closeGoal}>
            <h2 className="text-xl font-extrabold">Your goal</h2>
            <GoalRow done={state.goal.addedReceipt} title="Add food from a receipt" hint="Camera, upload, or the sample receipt." />
            <GoalRow done={state.goal.openedSoon} title="Open a food that is about to go bad" hint="Use Home, Pantry, or the bell." />
            <GoalRow done={state.goal.openedRecipe} title="Open a recipe that uses that food" hint="From Home, Recipes, or the food itself." />
            <Button
              type="button"
              className={tap}
              onClick={() => {
                closeGoal()
                if (!state.goal.addedReceipt) go(state.hasEntered ? "add" : "value")
                else if (!state.goal.openedSoon) tab("home")
                else tab("recipes")
              }}
            >
              {!state.goal.addedReceipt ? "Add a receipt" : !state.goal.openedSoon ? "See what is expiring" : "Find a recipe"}
            </Button>
          </Sheet>
        ) : null}
        {state.ready && state.goalDoneOpen ? (
          <Modal label="Goal complete">
            <h2 className="text-xl font-extrabold">You did it.</h2>
            <p className="text-sm">You added food, looked at what is going bad, and opened a recipe that uses it. Keep cooking, or try another path.</p>
            <Button type="button" className={tap} onClick={closeGoalDone}>Keep going</Button>
          </Modal>
        ) : null}
        {state.ready && state.tourStep > 0 && state.screen === "home" ? (
          <Sheet label="Tour">
            <p className="text-xs font-bold text-muted-foreground">Look around · {state.tourStep} of 4</p>
            <h2 className="text-xl font-extrabold">
              {state.tourStep === 1 ? "Eat this soon" : state.tourStep === 2 ? "A recipe from that food" : state.tourStep === 3 ? "Manage the details" : "What you ate"}
            </h2>
            <p className="text-sm">
              {state.tourStep === 1
                ? "Food closest to going bad is the first thing on Home. Tap one when you want the details."
                : state.tourStep === 2
                  ? "This recipe uses what is expiring. Open it from here, from Recipes, or from the food itself."
                  : state.tourStep === 3
                    ? "Pantry is where you change a count, a date, or where something sits. Reminders live in the bell."
                    : "Meals is where you log what you ate. We ask how much of each food is left."}
            </p>
            <Button type="button" className={tap} data-testid="tour-next" onClick={nextTour}>
              {state.tourStep === 4 ? "Done" : "Next"}
            </Button>
            <Button type="button" variant="ghost" className="h-11! font-semibold" data-testid="skip-tour" onClick={skipTour}>
              Skip the tour
            </Button>
          </Sheet>
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
          <Tab icon={<Refrigerator />} label="Pantry" on={active === "pantry"} onClick={() => tab("pantry")} testid="tab-pantry" />
          <Tab icon={<Utensils />} label="Meals" on={active === "meals"} onClick={() => tab("meals")} testid="tab-meals" />
          <Tab icon={<UserRound />} label="Profile" on={active === "profile"} onClick={() => tab("profile")} testid="tab-profile" />
        </nav>
      ) : (
        <div className="h-6 shrink-0" />
      )}
    </div>
  )
}

function Tab({ icon, label, on, onClick, testid }: { icon: ReactNode; label: string; on: boolean; onClick: () => void; testid: string }) {
  return (
    <button type="button" data-testid={testid} onClick={onClick} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${on ? "text-primary" : "text-[#6a665e]"}`}>
      {icon}
      {label}
    </button>
  )
}

function Modal({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#2b2a27]/50 p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="flex max-h-full w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-foreground bg-popover p-5">{children}</div>
    </div>
  )
}

function Sheet({ children, label, onClose }: { children: ReactNode; label: string; onClose?: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-[#2b2a27]/40" role="dialog" aria-modal="true" aria-label={label}>
      <div className="flex max-h-[78%] w-full flex-col gap-3 overflow-y-auto rounded-t-2xl border border-foreground bg-popover p-5">
        <div className="mx-auto h-1 w-10 rounded-full bg-[#bdb6a8]" />
        {onClose ? (
          <div className="flex justify-end">
            <Button type="button" variant="ghost" className="h-10!" onClick={onClose}>Close</Button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}

function GoalRow({ done, title, hint }: { done: boolean; title: string; hint: string }) {
  return (
    <div className="flex gap-3">
      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${done ? "border-primary bg-primary text-white" : "border-[#8c867a]"}`}>{done ? "✓" : ""}</span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="text-sm text-muted-foreground">{hint}</span>
      </span>
    </div>
  )
}
