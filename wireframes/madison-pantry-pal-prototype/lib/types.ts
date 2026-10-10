import type { LocationName, ReminderWhen } from "@/lib/food"

export type Screen =
  | "value"
  | "add"
  | "camera"
  | "upload"
  | "sample"
  | "reading"
  | "review"
  | "edit-draft"
  | "add-draft"
  | "unknown"
  | "produce"
  | "location"
  | "remind-when"
  | "added"
  | "account"
  | "login"
  | "home"
  | "recipes"
  | "recipe"
  | "cook"
  | "cooked"
  | "pantry"
  | "item"
  | "edit-item"
  | "add-item"
  | "needs"
  | "fix-locations"
  | "notifications"
  | "profile"
  | "edit-profile"
  | "reminders"
  | "about"
  | "parts"
  | "meals"
  | "log-meal"
  | "meal-left"

export type DraftLine = {
  id: string
  raw: string
  price: string
  kind: "ignored" | "unknown" | "food" | "produce"
  name: string
  location: LocationName | null
  days: number | null
  unit: string
  qty: number | null
  include: boolean
  needsName: boolean
  needsQuantity: boolean
  settledName: boolean
  settledQty: boolean
}

export type PantryItem = {
  id: string
  name: string
  qty: number | null
  unit: string
  location: LocationName | null
  daysLeft: number | null
  needsName: boolean
  needsQuantity: boolean
  needsLocation: boolean
}

export type Account = { name: string; email: string; password: string }

export type Reminder = {
  id: string
  kind: "location" | "details"
  when: ReminderWhen
  done: boolean
}

export type Goal = {
  addedReceipt: boolean
  openedSoon: boolean
  openedRecipe: boolean
  celebrated: boolean
}

export type PhotoSource = "camera" | "upload" | "sample" | null

export type Frame = {
  screen: Screen
  recipeId: string | null
  itemId: string | null
  cookStep: number
  promptId: string | null
}

export type CookChange = { name: string; note: string }

export type MealSlot = "Breakfast" | "Lunch" | "Dinner" | "Snack"

export type MealFood = { name: string; leftLabel: string }

export type Meal = {
  id: string
  slot: MealSlot
  note: string
  at: number
  foods: MealFood[]
}

export type MealAnswer = { itemId: string; name: string; unit: string; left: number }

export type State = {
  ready: boolean
  seq: number
  screen: Screen
  stack: Frame[]
  showNotice: boolean
  showGoal: boolean
  goalDoneOpen: boolean
  tourStep: number
  registered: Account | null
  session: { name: string; email: string } | null
  pantry: PantryItem[]
  reminders: Reminder[]
  goal: Goal
  savedIds: string[]
  used: number
  tossed: number
  seenTour: boolean
  hasEntered: boolean
  photo: string | null
  photoSource: PhotoSource
  draft: DraftLine[]
  promptId: string | null
  recipeId: string | null
  itemId: string | null
  cookStep: number
  cookChanges: CookChange[]
  recipeQuery: string
  recipeSeg: "foryou" | "all" | "saved"
  pantryQuery: string
  pantryFilter: string
  toast: string
  toastNonce: number
  addedCount: number
  soonestName: string
  pendingToss: boolean
  confirmLogout: boolean
  confirmReset: boolean
  importedOnce: boolean
  meals: Meal[]
  mealSlot: MealSlot
  mealNote: string
  mealPicks: string[]
  mealQueue: string[]
  mealAnswers: MealAnswer[]
  tipIndex: number
  demoMode: boolean
}
