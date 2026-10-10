"use client"

import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react"
import {
  interpretLine,
  isSoon,
  RECIPES,
  SAMPLE_LINES,
  sameFood,
  usesSoonFood,
  type LocationName,
  type ReminderWhen,
} from "@/lib/food"
import type { Account, CookChange, DraftLine, Frame, Meal, MealAnswer, MealSlot, PantryItem, PhotoSource, Screen, State } from "@/lib/types"

const KEY = "pantry-pal-draft-v1"

const emptyGoal = { addedReceipt: false, openedSoon: false, openedRecipe: false, celebrated: false }

export const initialState: State = {
  ready: false,
  seq: 1,
  screen: "value",
  stack: [],
  showNotice: true,
  showGoal: false,
  goalDoneOpen: false,
  tourStep: 0,
  registered: null,
  session: null,
  pantry: [],
  reminders: [],
  goal: emptyGoal,
  savedIds: [],
  used: 0,
  tossed: 0,
  seenTour: false,
  hasEntered: false,
  photo: null,
  photoSource: null,
  draft: [],
  promptId: null,
  recipeId: null,
  itemId: null,
  cookStep: 0,
  cookChanges: [],
  recipeQuery: "",
  recipeSeg: "foryou",
  pantryQuery: "",
  pantryFilter: "All",
  toast: "",
  toastNonce: 0,
  addedCount: 0,
  soonestName: "",
  pendingToss: false,
  confirmLogout: false,
  confirmReset: false,
  importedOnce: false,
  meals: [],
  mealSlot: "Dinner",
  mealNote: "",
  mealPicks: [],
  mealQueue: [],
  mealAnswers: [],
  tipIndex: 0,
}

type Persisted = Pick<
  State,
  "registered" | "session" | "pantry" | "reminders" | "goal" | "savedIds" | "used" | "tossed" | "seenTour" | "hasEntered" | "importedOnce" | "seq" | "meals"
>

function frameOf(state: State): Frame {
  return {
    screen: state.screen,
    recipeId: state.recipeId,
    itemId: state.itemId,
    cookStep: state.cookStep,
    promptId: state.promptId,
  }
}

function applyFrame(state: State, frame: Frame): State {
  return {
    ...state,
    screen: frame.screen,
    recipeId: frame.recipeId,
    itemId: frame.itemId,
    cookStep: frame.cookStep,
    promptId: frame.promptId,
  }
}

function bump(state: State, prefix: string) {
  const seq = state.seq + 1
  return { seq, id: `${prefix}-${seq}` }
}

function say(state: State, toast: string): State {
  return { ...state, toast, toastNonce: state.toastNonce + 1 }
}

function goalPatch(state: State, patch: Partial<State["goal"]>): Pick<State, "goal" | "goalDoneOpen"> {
  const goal = { ...state.goal, ...patch }
  const done = goal.addedReceipt && goal.openedSoon && goal.openedRecipe
  const show = done && !goal.celebrated && state.tourStep === 0
  return {
    goal: { ...goal, celebrated: goal.celebrated || show },
    goalDoneOpen: state.goalDoneOpen || show,
  }
}

function buildDraft(state: State): { draft: DraftLine[]; seq: number } {
  let seq = state.seq
  const draft = SAMPLE_LINES.map((line) => {
    seq += 1
    const read = interpretLine(line.raw)
    return {
      id: `line-${seq}`,
      raw: line.raw,
      price: line.price,
      kind: read.kind,
      name: read.name,
      location: read.location,
      days: read.days,
      unit: read.unit,
      qty: read.qty,
      include: read.kind !== "ignored",
      needsName: read.needsName,
      needsQuantity: read.needsQuantity,
      settledName: !read.needsName,
      settledQty: !read.needsQuantity,
    }
  })
  return { draft, seq }
}

function nextPrompt(draft: DraftLine[]) {
  const unknown = draft.find((line) => line.include && line.needsName && !line.settledName)
  if (unknown) return { screen: "unknown" as const, promptId: unknown.id }
  const produce = draft.find((line) => line.include && line.needsQuantity && !line.settledQty)
  if (produce) return { screen: "produce" as const, promptId: produce.id }
  return { screen: "location" as const, promptId: null }
}

function toItem(line: DraftLine, id: string, keepLocations: boolean): PantryItem {
  return {
    id,
    name: line.name.trim() || line.raw,
    qty: line.qty,
    unit: line.unit,
    location: keepLocations ? line.location : null,
    daysLeft: line.days,
    needsName: line.needsName,
    needsQuantity: line.needsQuantity,
    needsLocation: keepLocations ? !line.location : true,
  }
}

function mergePantry(pantry: PantryItem[], incoming: PantryItem[]) {
  const next = pantry.map((item) => ({ ...item }))
  for (const item of incoming) {
    const index = next.findIndex((current) => current.name && sameFood(current.name, item.name) && !item.needsName)
    if (index === -1) {
      next.push(item)
      continue
    }
      const current = next[index]
      const qty = current.qty !== null && item.qty !== null ? current.qty + item.qty : item.qty ?? current.qty
      const days = [current.daysLeft, item.daysLeft].filter((daysLeft): daysLeft is number => daysLeft !== null)
      const location = item.location ?? current.location
      next[index] = {
        ...current,
        qty,
        unit: item.unit || current.unit,
        location,
        daysLeft: days.length ? Math.min(...days) : null,
        needsName: item.needsName || current.needsName,
        needsQuantity: item.needsQuantity && current.needsQuantity,
        needsLocation: !location,
      }
  }
  return next
}

function soonest(pantry: PantryItem[]) {
  return pantry
    .filter((item) => isSoon(item.daysLeft))
    .sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99))[0]
}

function commitDraft(state: State, keepLocations: boolean, when?: ReminderWhen): State {
  let seq = state.seq
  const incoming = state.draft
    .filter((line) => line.include && line.kind !== "ignored")
    .map((line) => {
      seq += 1
      return toItem(line, `food-${seq}`, keepLocations)
    })
  const pantry = mergePantry(state.pantry, incoming)
  let reminders = state.reminders.map((reminder) => ({ ...reminder }))
  if (when) {
    seq += 1
    reminders = reminders.filter((reminder) => reminder.kind !== "location" || reminder.done).concat([
      { id: `rem-${seq}`, kind: "location", when, done: false },
    ])
  }
  const needsDetails = pantry.some((item) => item.needsName || item.needsQuantity || item.daysLeft === null)
  if (needsDetails && !reminders.some((reminder) => reminder.kind === "details" && !reminder.done)) {
    seq += 1
    reminders.push({ id: `rem-${seq}`, kind: "details", when: "Tonight", done: false })
  }
  const first = soonest(pantry)
  const goal = goalPatch({ ...state, tourStep: state.tourStep }, { addedReceipt: true })
  return say(
    {
      ...state,
      ...goal,
      seq,
      pantry,
      reminders,
      draft: [],
      promptId: null,
      screen: "added",
      addedCount: incoming.length,
      soonestName: first?.name ?? "",
      importedOnce: true,
      hasEntered: true,
    },
    when ? `Reminder set for ${when.toLowerCase()}.` : keepLocations ? "Places saved." : "Skipped places for now."
  )
}

function changeQty(item: PantryItem, removeNote: string): { item: PantryItem | null; note: string; usedUp: boolean } {
  if (item.qty !== null && item.qty > 1) {
    return { item: { ...item, qty: item.qty - 1 }, note: `${item.name} is now ${item.qty - 1} ${item.unit}`, usedUp: false }
  }
  return { item: null, note: removeNote, usedUp: true }
}

type Action =
  | { type: "hydrate"; saved: Persisted | null }
  | { type: "toast-clear" }
  | { type: "notice"; open: boolean }
  | { type: "goal"; open: boolean }
  | { type: "goal-done-close" }
  | { type: "look" }
  | { type: "go"; screen: Screen }
  | { type: "back" }
  | { type: "tab"; screen: Screen }
  | { type: "photo"; photo: string; source: PhotoSource }
  | { type: "read" }
  | { type: "show-review" }
  | { type: "toggle-line"; id: string }
  | { type: "set-location-draft"; id: string; location: LocationName | null }
  | { type: "continue-review" }
  | { type: "save-unknown"; name: string }
  | { type: "defer-unknown" }
  | { type: "save-produce"; qty: number }
  | { type: "defer-produce" }
  | { type: "save-places" }
  | { type: "skip-places" }
  | { type: "remind"; when: ReminderWhen }
  | { type: "create-account"; account: Account }
  | { type: "skip-account" }
  | { type: "login" }
  | { type: "logout" }
  | { type: "update-account"; account: Account }
  | { type: "tour-start" }
  | { type: "tour-skip" }
  | { type: "tour-next" }
  | { type: "open-item"; id: string }
  | { type: "open-recipe"; id: string; fromSoon: boolean }
  | { type: "toggle-save" }
  | { type: "recipe-query"; query: string }
  | { type: "recipe-seg"; seg: State["recipeSeg"] }
  | { type: "pantry-query"; query: string }
  | { type: "pantry-filter"; filter: string }
  | { type: "save-item"; item: PantryItem }
  | { type: "patch-item"; item: PantryItem }
  | { type: "ask-toss" }
  | { type: "cancel-toss" }
  | { type: "toss" }
  | { type: "use-item" }
  | { type: "add-item"; item: Omit<PantryItem, "id"> }
  | { type: "cook-start" }
  | { type: "cook-next" }
  | { type: "cook-back" }
  | { type: "cook-finish"; names: string[] }
  | { type: "dismiss-reminder"; id: string }
  | { type: "do-reminder"; id: string }
  | { type: "set-item-location"; id: string; location: LocationName | null }
  | { type: "finish-locations"; stop: boolean }
  | { type: "ask-logout" }
  | { type: "cancel-logout" }
  | { type: "ask-reset" }
  | { type: "cancel-reset" }
  | { type: "reset" }
  | { type: "start-log" }
  | { type: "meal-slot"; slot: MealSlot }
  | { type: "meal-note"; note: string }
  | { type: "meal-pick"; id: string }
  | { type: "begin-check" }
  | { type: "confirm-left"; left: number }
  | { type: "record-cooked" }
  | { type: "next-tip" }

function enterHome(state: State): State {
  const done = state.goal.addedReceipt && state.goal.openedSoon && state.goal.openedRecipe
  return {
    ...state,
    screen: "home",
    stack: [],
    tourStep: 0,
    seenTour: true,
    hasEntered: true,
    showNotice: false,
    goalDoneOpen: done && !state.goal.celebrated,
    goal: { ...state.goal, celebrated: state.goal.celebrated || done },
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate": {
      if (!action.saved) return { ...state, ready: true }
      const saved = action.saved
      return {
        ...state,
        ...saved,
        meals: saved.meals ?? [],
        ready: true,
        screen: saved.hasEntered ? "home" : "value",
        showNotice: !saved.hasEntered,
        stack: [],
      }
    }
    case "toast-clear":
      return { ...state, toast: "" }
    case "notice":
      return { ...state, showNotice: action.open }
    case "goal":
      return { ...state, showGoal: action.open }
    case "goal-done-close":
      return { ...state, goalDoneOpen: false }
    case "look":
      return { ...state, showNotice: false, hasEntered: true, screen: "home", stack: [] }
    case "go":
      return { ...state, stack: state.stack.concat(frameOf(state)), screen: action.screen, showNotice: false, showGoal: false }
    case "back": {
      const stack = state.stack.slice()
      const previous = stack.pop()
      if (!previous) return { ...state, screen: state.hasEntered ? "home" : "value", stack: [] }
      return applyFrame({ ...state, stack }, previous)
    }
    case "tab":
      return { ...state, screen: action.screen, stack: [], showGoal: false, pendingToss: false }
    case "photo":
      return { ...state, photo: action.photo, photoSource: action.source }
    case "read": {
      const built = buildDraft(state)
      return { ...state, draft: built.draft, seq: built.seq, screen: "reading" }
    }
    case "show-review":
      if (state.screen !== "reading") return state
      return { ...state, screen: "review" }
    case "toggle-line":
      return {
        ...state,
        draft: state.draft.map((line) => (line.id === action.id ? { ...line, include: !line.include } : line)),
      }
    case "set-location-draft":
      return {
        ...state,
        draft: state.draft.map((line) => (line.id === action.id ? { ...line, location: action.location } : line)),
      }
    case "continue-review": {
      const next = nextPrompt(state.draft)
      return { ...state, stack: state.stack.concat(frameOf(state)), screen: next.screen, promptId: next.promptId }
    }
    case "save-unknown": {
      const draft = state.draft.map((line) =>
        line.id === state.promptId ? { ...line, name: action.name.trim(), needsName: false, settledName: true } : line
      )
      const next = nextPrompt(draft)
      return { ...state, draft, screen: next.screen, promptId: next.promptId }
    }
    case "defer-unknown": {
      const draft = state.draft.map((line) => (line.id === state.promptId ? { ...line, settledName: true } : line))
      const next = nextPrompt(draft)
      return { ...state, draft, screen: next.screen, promptId: next.promptId }
    }
    case "save-produce": {
      const draft = state.draft.map((line) =>
        line.id === state.promptId ? { ...line, qty: action.qty, needsQuantity: false, settledQty: true } : line
      )
      const next = nextPrompt(draft)
      return { ...state, draft, screen: next.screen, promptId: next.promptId }
    }
    case "defer-produce": {
      const draft = state.draft.map((line) => (line.id === state.promptId ? { ...line, settledQty: true } : line))
      const next = nextPrompt(draft)
      return { ...state, draft, screen: next.screen, promptId: next.promptId }
    }
    case "save-places":
      return commitDraft(state, true)
    case "skip-places":
      return commitDraft(state, false)
    case "remind":
      return commitDraft(state, false, action.when)
    case "create-account": {
      const session = { name: action.account.name, email: action.account.email }
      const base = { ...state, registered: action.account, session }
      const first = action.account.name.split(" ")[0]
      const fromProfile = state.stack.some((frame) => frame.screen === "profile" || frame.screen === "edit-profile")
      if (fromProfile) return say({ ...base, screen: "profile", stack: [] }, `You're in, ${first}.`)
      if (!state.seenTour && state.pantry.length > 0) {
        return say({ ...base, screen: "home", stack: [], tourStep: 1, showNotice: false, hasEntered: true }, `You're in, ${first}.`)
      }
      return say({ ...base, screen: "home", stack: [], hasEntered: true, seenTour: true, showNotice: false }, `You're in, ${first}.`)
    }
    case "skip-account":
      if (!state.seenTour && state.pantry.length > 0) {
        return { ...state, screen: "home", stack: [], tourStep: 1, showNotice: false, hasEntered: true }
      }
      return { ...state, screen: "home", stack: [], hasEntered: true, seenTour: true, showNotice: false }
    case "login":
      return state.registered
        ? say({ ...state, session: { name: state.registered.name, email: state.registered.email }, screen: "profile", stack: [] }, `Welcome back, ${state.registered.name.split(" ")[0]}.`)
        : state
    case "logout":
      return say({ ...state, session: null, confirmLogout: false, screen: "profile" }, "Logged out on this phone.")
    case "update-account":
      return say(
        {
          ...state,
          registered: action.account,
          session: { name: action.account.name, email: action.account.email },
          screen: "profile",
          stack: [],
        },
        "Account saved."
      )
    case "tour-start":
      return { ...state, screen: "home", stack: [], tourStep: 1, showNotice: false }
    case "tour-skip":
      return enterHome(state)
    case "tour-next":
      if (state.tourStep >= 4) return enterHome(state)
      return { ...state, tourStep: state.tourStep + 1 }
    case "open-item": {
      const item = state.pantry.find((food) => food.id === action.id)
      const patch = item && isSoon(item.daysLeft) ? goalPatch(state, { openedSoon: true }) : null
      return {
        ...state,
        ...(patch ?? {}),
        stack: state.stack.concat(frameOf(state)),
        screen: "item",
        itemId: action.id,
        pendingToss: false,
      }
    }
    case "open-recipe": {
      const recipe = RECIPES.find((item) => item.id === action.id)
      const fromSoon = action.fromSoon || (!!recipe && usesSoonFood(recipe, state.pantry) && state.screen === "home")
      const patch = recipe && usesSoonFood(recipe, state.pantry) ? goalPatch(state, { openedRecipe: true, openedSoon: state.goal.openedSoon || fromSoon }) : null
      return { ...state, ...(patch ?? {}), stack: state.stack.concat(frameOf(state)), screen: "recipe", recipeId: action.id }
    }
    case "toggle-save": {
      if (!state.recipeId) return state
      const on = state.savedIds.includes(state.recipeId)
      return say(
        { ...state, savedIds: on ? state.savedIds.filter((id) => id !== state.recipeId) : state.savedIds.concat(state.recipeId) },
        on ? "Removed from Saved." : "Saved. Find it under Recipes, Saved."
      )
    }
    case "recipe-query":
      return { ...state, recipeQuery: action.query }
    case "recipe-seg":
      return { ...state, recipeSeg: action.seg }
    case "pantry-query":
      return { ...state, pantryQuery: action.query }
    case "pantry-filter":
      return { ...state, pantryFilter: action.filter }
    case "save-item":
      return say(
        {
          ...state,
          pantry: state.pantry.map((item) => (item.id === action.item.id ? action.item : item)),
          screen: "item",
          itemId: action.item.id,
        },
        "Saved."
      )
    case "patch-item": {
      const pantry = state.pantry.map((item) => (item.id === action.item.id ? action.item : item))
      const still = pantry.some((item) => item.needsName || item.needsQuantity || item.daysLeft === null)
      return say(
        {
          ...state,
          pantry,
          reminders: still ? state.reminders : state.reminders.map((reminder) => (reminder.kind === "details" ? { ...reminder, done: true } : reminder)),
        },
        "Saved."
      )
    }
    case "ask-toss":
      return { ...state, pendingToss: true }
    case "cancel-toss":
      return { ...state, pendingToss: false }
    case "toss": {
      const item = state.pantry.find((food) => food.id === state.itemId)
      if (!item) return state
      const stack = state.stack.slice()
      const previous = stack.pop()
      const base = previous ? applyFrame({ ...state, stack }, previous) : { ...state, screen: "pantry" as const, stack }
      return say(
        { ...base, pantry: state.pantry.filter((food) => food.id !== item.id), tossed: state.tossed + 1, pendingToss: false },
        `${item.name} tossed. We'll flag food like this sooner next time.`
      )
    }
    case "use-item": {
      const item = state.pantry.find((food) => food.id === state.itemId)
      if (!item) return state
      const changed = changeQty(item, `${item.name} used up.`)
      const pantry = changed.item ? state.pantry.map((food) => (food.id === item.id ? changed.item! : food)) : state.pantry.filter((food) => food.id !== item.id)
      const stack = state.stack.slice()
      const previous = stack.pop()
      const base = previous ? applyFrame({ ...state, stack }, previous) : { ...state, screen: "pantry" as const, stack }
      return say({ ...base, pantry, used: state.used + (changed.usedUp ? 1 : 0) }, changed.note)
    }
    case "add-item": {
      const id = bump(state, "food")
      const item: PantryItem = { ...action.item, id: id.id }
      return say({ ...state, seq: id.seq, pantry: state.pantry.concat(item), screen: "pantry", stack: [], pantryFilter: "All" }, `${item.name} added.`)
    }
    case "cook-start":
      return { ...state, stack: state.stack.concat(frameOf(state)), screen: "cook", cookStep: 0 }
    case "cook-next": {
      const recipe = RECIPES.find((item) => item.id === state.recipeId)
      if (!recipe) return state
      if (state.cookStep >= recipe.steps.length - 1) return state
      return { ...state, cookStep: state.cookStep + 1 }
    }
    case "cook-back":
      if (state.cookStep > 0) return { ...state, cookStep: state.cookStep - 1 }
      return reducer(state, { type: "back" })
    case "cook-finish": {
      const recipe = RECIPES.find((item) => item.id === state.recipeId)
      if (!recipe) return state
      let pantry = state.pantry.map((item) => ({ ...item }))
      let used = state.used
      const cookChanges: CookChange[] = []
      for (const name of action.names) {
        const index = pantry.findIndex((item) => sameFood(item.name, name))
        if (index === -1) continue
        const changed = changeQty(pantry[index], `${pantry[index].name} used up.`)
        cookChanges.push({ name: pantry[index].name, note: changed.note })
        if (changed.usedUp) used += 1
        if (changed.item) pantry[index] = changed.item
        else pantry = pantry.filter((_, itemIndex) => itemIndex !== index)
      }
      return say({ ...state, pantry, used, cookChanges, screen: "cooked" }, "Pantry updated.")
    }
    case "dismiss-reminder":
      return {
        ...state,
        reminders: state.reminders.map((reminder) => (reminder.id === action.id ? { ...reminder, done: true } : reminder)),
      }
    case "do-reminder": {
      const reminder = state.reminders.find((item) => item.id === action.id)
      if (!reminder) return state
      return {
        ...state,
        stack: state.stack.concat(frameOf(state)),
        screen: reminder.kind === "location" ? "fix-locations" : "needs",
      }
    }
    case "set-item-location":
      return {
        ...state,
        pantry: state.pantry.map((item) =>
          item.id === action.id ? { ...item, location: action.location, needsLocation: !action.location } : item
        ),
      }
    case "finish-locations": {
      const unresolved = state.pantry.some((item) => !item.location)
      const clear = action.stop || !unresolved
      return say(
        {
          ...state,
          reminders: state.reminders.map((reminder) => (reminder.kind === "location" && clear ? { ...reminder, done: true } : reminder)),
          screen: "home",
          stack: [],
        },
        action.stop ? "Reminder cleared." : unresolved ? "Saved the places you set." : "Every food has a place."
      )
    }
    case "ask-logout":
      return { ...state, confirmLogout: true }
    case "cancel-logout":
      return { ...state, confirmLogout: false }
    case "ask-reset":
      return { ...state, confirmReset: true }
    case "cancel-reset":
      return { ...state, confirmReset: false }
    case "reset":
      return { ...initialState, ready: true, showNotice: true }
    case "start-log":
      return {
        ...state,
        stack: state.stack.concat(frameOf(state)),
        screen: "log-meal",
        mealSlot: slotNow(),
        mealNote: "",
        mealPicks: [],
        mealQueue: [],
        mealAnswers: [],
        promptId: null,
      }
    case "meal-slot":
      return { ...state, mealSlot: action.slot }
    case "meal-note":
      return { ...state, mealNote: action.note }
    case "meal-pick":
      return {
        ...state,
        mealPicks: state.mealPicks.includes(action.id) ? state.mealPicks.filter((id) => id !== action.id) : state.mealPicks.concat(action.id),
      }
    case "begin-check": {
      const picks = state.mealPicks.filter((id) => state.pantry.some((item) => item.id === id))
      if (!picks.length && !state.mealNote.trim()) return say(state, "Choose a food, or write what you ate.")
      if (!picks.length) return saveMeal(state, [])
      return { ...state, mealQueue: picks, mealAnswers: [], promptId: picks[0], screen: "meal-left" }
    }
    case "confirm-left": {
      const item = state.pantry.find((food) => food.id === state.promptId)
      if (!item) return state
      const answers = state.mealAnswers.concat([{ itemId: item.id, name: item.name, unit: item.unit, left: action.left }])
      const rest = state.mealQueue.filter((id) => id !== item.id)
      if (rest.length) return { ...state, mealAnswers: answers, mealQueue: rest, promptId: rest[0] }
      return saveMeal({ ...state, mealAnswers: answers }, answers)
    }
    case "record-cooked": {
      const recipe = RECIPES.find((item) => item.id === state.recipeId)
      const id = bump(state, "meal")
      const meal: Meal = {
        id: id.id,
        slot: slotNow(),
        note: recipe?.title ?? "Cooked meal",
        at: Date.now(),
        foods: state.cookChanges.map((change) => ({ name: change.name, leftLabel: change.note })),
      }
      return say({ ...state, seq: id.seq, meals: [meal, ...state.meals], screen: "meals", stack: [] }, "Saved in Meals.")
    }
    case "next-tip":
      return { ...state, tipIndex: state.tipIndex + 1 }
    default:
      return state
  }
}

function slotNow(): MealSlot {
  const hour = new Date().getHours()
  if (hour < 11) return "Breakfast"
  if (hour < 16) return "Lunch"
  if (hour < 21) return "Dinner"
  return "Snack"
}

function saveMeal(state: State, answers: MealAnswer[]): State {
  let pantry = state.pantry.map((item) => ({ ...item }))
  let used = state.used
  for (const answer of answers) {
    if (answer.left <= 0) {
      if (pantry.some((item) => item.id === answer.itemId)) used += 1
      pantry = pantry.filter((item) => item.id !== answer.itemId)
      continue
    }
    pantry = pantry.map((item) => (item.id === answer.itemId ? { ...item, qty: answer.left, needsQuantity: false } : item))
  }
  const id = bump({ ...state, seq: state.seq }, "meal")
  const meal: Meal = {
    id: id.id,
    slot: state.mealSlot,
    note: state.mealNote.trim(),
    at: Date.now(),
    foods: answers.map((answer) => ({
      name: answer.name,
      leftLabel: answer.left <= 0 ? "None left" : `${answer.left} ${answer.unit} left`,
    })),
  }
  return say(
    {
      ...state,
      seq: id.seq,
      pantry,
      used,
      meals: [meal, ...state.meals],
      screen: "meals",
      stack: [],
      mealPicks: [],
      mealQueue: [],
      mealAnswers: [],
      promptId: null,
    },
    "Meal saved."
  )
}

type Api = {
  state: State
  openNotice: () => void
  closeNotice: () => void
  openGoal: () => void
  closeGoal: () => void
  closeGoalDone: () => void
  lookAround: () => void
  go: (screen: Screen) => void
  back: () => void
  tab: (screen: Screen) => void
  setPhoto: (photo: string, source: PhotoSource) => void
  beginRead: () => void
  finishRead: () => void
  toggleLine: (id: string) => void
  setDraftLocation: (id: string, location: LocationName | null) => void
  continueReview: () => void
  saveUnknown: (name: string) => void
  deferUnknown: () => void
  saveProduce: (qty: number) => void
  deferProduce: () => void
  savePlaces: () => void
  skipPlaces: () => void
  remindLater: (when: ReminderWhen) => void
  createAccount: (account: Account) => void
  skipAccount: () => void
  login: (email: string, password: string) => boolean
  logout: () => void
  updateAccount: (account: Account) => void
  startTour: () => void
  skipTour: () => void
  nextTour: () => void
  replayTour: () => void
  openItem: (id: string) => void
  openRecipe: (id: string, fromSoon?: boolean) => void
  toggleSave: () => void
  setRecipeQuery: (query: string) => void
  setRecipeSeg: (seg: State["recipeSeg"]) => void
  setPantryQuery: (query: string) => void
  setPantryFilter: (filter: string) => void
  saveItem: (item: PantryItem) => void
  patchItem: (item: PantryItem) => void
  askToss: () => void
  cancelToss: () => void
  toss: () => void
  useItem: () => void
  addItem: (item: Omit<PantryItem, "id">) => void
  startCook: () => void
  cookNext: () => void
  cookBack: () => void
  finishCook: (names: string[]) => void
  dismissReminder: (id: string) => void
  doReminder: (id: string) => void
  setItemLocation: (id: string, location: LocationName | null) => void
  finishLocations: (stop: boolean) => void
  askLogout: () => void
  cancelLogout: () => void
  askReset: () => void
  cancelReset: () => void
  reset: () => void
  goAccount: () => void
  goKitchen: () => void
  startLog: () => void
  setMealSlot: (slot: MealSlot) => void
  setMealNote: (note: string) => void
  toggleMealPick: (id: string) => void
  beginMealCheck: () => void
  confirmLeft: (left: number) => void
  recordCooked: () => void
  nextTip: () => void
}

const Ctx = createContext<Api | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  const hydrated = useRef(false)

  useEffect(() => {
    stateRef.current = state
  })

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    try {
      const raw = localStorage.getItem(KEY)
      dispatch({ type: "hydrate", saved: raw ? (JSON.parse(raw) as Persisted) : null })
    } catch {
      dispatch({ type: "hydrate", saved: null })
    }
  }, [])

  useEffect(() => {
    if (!state.ready) return
    const saved: Persisted = {
      registered: state.registered,
      session: state.session,
      pantry: state.pantry,
      reminders: state.reminders,
      goal: state.goal,
      savedIds: state.savedIds,
      used: state.used,
      tossed: state.tossed,
      seenTour: state.seenTour,
      hasEntered: state.hasEntered,
      importedOnce: state.importedOnce,
      seq: state.seq,
      meals: state.meals,
    }
    localStorage.setItem(KEY, JSON.stringify(saved))
  }, [state])

  useEffect(() => {
    if (!state.toast) return
    const timer = setTimeout(() => dispatch({ type: "toast-clear" }), 2600)
    return () => clearTimeout(timer)
  }, [state.toast, state.toastNonce])

  const api: Api = {
    state,
    openNotice: () => dispatch({ type: "notice", open: true }),
    closeNotice: () => dispatch({ type: "notice", open: false }),
    openGoal: () => dispatch({ type: "goal", open: true }),
    closeGoal: () => dispatch({ type: "goal", open: false }),
    closeGoalDone: () => dispatch({ type: "goal-done-close" }),
    lookAround: () => dispatch({ type: "look" }),
    go: (screen) => dispatch({ type: "go", screen }),
    back: () => dispatch({ type: "back" }),
    tab: (screen) => dispatch({ type: "tab", screen }),
    setPhoto: (photo, source) => dispatch({ type: "photo", photo, source }),
    beginRead: () => dispatch({ type: "read" }),
    finishRead: () => dispatch({ type: "show-review" }),
    toggleLine: (id) => dispatch({ type: "toggle-line", id }),
    setDraftLocation: (id, location) => dispatch({ type: "set-location-draft", id, location }),
    continueReview: () => dispatch({ type: "continue-review" }),
    saveUnknown: (name) => dispatch({ type: "save-unknown", name }),
    deferUnknown: () => dispatch({ type: "defer-unknown" }),
    saveProduce: (qty) => dispatch({ type: "save-produce", qty }),
    deferProduce: () => dispatch({ type: "defer-produce" }),
    savePlaces: () => dispatch({ type: "save-places" }),
    skipPlaces: () => dispatch({ type: "skip-places" }),
    remindLater: (when) => dispatch({ type: "remind", when }),
    createAccount: (account) => dispatch({ type: "create-account", account }),
    skipAccount: () => dispatch({ type: "skip-account" }),
    login: (email, password) => {
      const registered = stateRef.current.registered
      if (!registered || registered.email.toLowerCase() !== email.trim().toLowerCase() || registered.password !== password) return false
      dispatch({ type: "login" })
      return true
    },
    logout: () => dispatch({ type: "logout" }),
    updateAccount: (account) => dispatch({ type: "update-account", account }),
    startTour: () => dispatch({ type: "tour-start" }),
    skipTour: () => dispatch({ type: "tour-skip" }),
    nextTour: () => dispatch({ type: "tour-next" }),
    replayTour: () => dispatch({ type: "tour-start" }),
    openItem: (id) => dispatch({ type: "open-item", id }),
    openRecipe: (id, fromSoon = false) => dispatch({ type: "open-recipe", id, fromSoon }),
    toggleSave: () => dispatch({ type: "toggle-save" }),
    setRecipeQuery: (query) => dispatch({ type: "recipe-query", query }),
    setRecipeSeg: (seg) => dispatch({ type: "recipe-seg", seg }),
    setPantryQuery: (query) => dispatch({ type: "pantry-query", query }),
    setPantryFilter: (filter) => dispatch({ type: "pantry-filter", filter }),
    saveItem: (item) => dispatch({ type: "save-item", item }),
    patchItem: (item) => dispatch({ type: "patch-item", item }),
    askToss: () => dispatch({ type: "ask-toss" }),
    cancelToss: () => dispatch({ type: "cancel-toss" }),
    toss: () => dispatch({ type: "toss" }),
    useItem: () => dispatch({ type: "use-item" }),
    addItem: (item) => dispatch({ type: "add-item", item }),
    startCook: () => dispatch({ type: "cook-start" }),
    cookNext: () => dispatch({ type: "cook-next" }),
    cookBack: () => dispatch({ type: "cook-back" }),
    finishCook: (names) => dispatch({ type: "cook-finish", names }),
    dismissReminder: (id) => dispatch({ type: "dismiss-reminder", id }),
    doReminder: (id) => dispatch({ type: "do-reminder", id }),
    setItemLocation: (id, location) => dispatch({ type: "set-item-location", id, location }),
    finishLocations: (stop) => dispatch({ type: "finish-locations", stop }),
    askLogout: () => dispatch({ type: "ask-logout" }),
    cancelLogout: () => dispatch({ type: "cancel-logout" }),
    askReset: () => dispatch({ type: "ask-reset" }),
    cancelReset: () => dispatch({ type: "cancel-reset" }),
    reset: () => {
      localStorage.removeItem(KEY)
      dispatch({ type: "reset" })
    },
    goAccount: () => dispatch({ type: "go", screen: state.registered && !state.session ? "login" : "account" }),
    startLog: () => dispatch({ type: "start-log" }),
    setMealSlot: (slot) => dispatch({ type: "meal-slot", slot }),
    setMealNote: (note) => dispatch({ type: "meal-note", note }),
    toggleMealPick: (id) => dispatch({ type: "meal-pick", id }),
    beginMealCheck: () => dispatch({ type: "begin-check" }),
    confirmLeft: (left) => dispatch({ type: "confirm-left", left }),
    recordCooked: () => dispatch({ type: "record-cooked" }),
    nextTip: () => dispatch({ type: "next-tip" }),
    goKitchen: () => {
      if (!stateRef.current.seenTour && stateRef.current.pantry.length > 0) dispatch({ type: "tour-start" })
      else dispatch({ type: "tab", screen: "home" })
    },
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useApp() {
  const value = useContext(Ctx)
  if (!value) throw new Error("useApp must be used inside AppProvider")
  return value
}
