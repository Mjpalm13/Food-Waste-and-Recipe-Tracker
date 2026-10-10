export const LOCATIONS = ["Fridge", "Freezer", "Cabinet", "Counter"] as const
export type LocationName = (typeof LOCATIONS)[number]
export type ReminderWhen = "Tonight" | "Tomorrow morning" | "This weekend"

export type CatalogFood = {
  keys: string[]
  name: string
  location: LocationName
  days: number
  unit: string
  qty: number | null
  produce: boolean
}

export const CATALOG: CatalogFood[] = [
  { keys: ["milk"], name: "Whole milk", location: "Fridge", days: 7, unit: "gal", qty: 1, produce: false },
  { keys: ["chkn", "chicken thigh", "chicken"], name: "Chicken thighs", location: "Fridge", days: 1, unit: "lb", qty: 1, produce: false },
  { keys: ["spinach"], name: "Baby spinach", location: "Fridge", days: 3, unit: "bag", qty: 1, produce: false },
  { keys: ["egg"], name: "Eggs", location: "Fridge", days: 21, unit: "dozen", qty: 1, produce: false },
  { keys: ["brd", "bread"], name: "Wheat bread", location: "Counter", days: 5, unit: "loaf", qty: 1, produce: false },
  { keys: ["bnna", "banana"], name: "Bananas", location: "Counter", days: 2, unit: "bananas", qty: null, produce: true },
  { keys: ["garlic"], name: "Garlic", location: "Cabinet", days: 21, unit: "bulbs", qty: null, produce: true },
  { keys: ["yogurt"], name: "Greek yogurt", location: "Fridge", days: 10, unit: "cups", qty: 1, produce: false },
  { keys: ["rice"], name: "Rice", location: "Cabinet", days: 180, unit: "bag", qty: 1, produce: false },
  { keys: ["butter"], name: "Butter", location: "Fridge", days: 30, unit: "sticks", qty: 1, produce: false },
  { keys: ["cheddar", "cheese"], name: "Cheddar", location: "Fridge", days: 21, unit: "block", qty: 1, produce: false },
  { keys: ["pasta"], name: "Pasta", location: "Cabinet", days: 180, unit: "box", qty: 1, produce: false },
  { keys: ["tortilla"], name: "Tortillas", location: "Fridge", days: 14, unit: "pack", qty: 1, produce: false },
  { keys: ["onion"], name: "Onion", location: "Cabinet", days: 14, unit: "onions", qty: null, produce: true },
  { keys: ["tomato"], name: "Tomatoes", location: "Counter", days: 4, unit: "tomatoes", qty: null, produce: true },
  { keys: ["orange juice", " oj"], name: "Orange juice", location: "Fridge", days: 7, unit: "carton", qty: 1, produce: false },
]

export const SAMPLE_LINES: { raw: string; price: string }[] = [
  { raw: "GV MILK 1GAL", price: "3.49" },
  { raw: "CHKN THGH BNLS", price: "6.28" },
  { raw: "BABY SPINACH 5OZ", price: "2.99" },
  { raw: "EGGS LG 12CT", price: "2.79" },
  { raw: "BRD WHL WHT", price: "2.49" },
  { raw: "BNNA", price: "1.18" },
  { raw: "STR FR 4421", price: "4.55" },
  { raw: "TAX", price: "1.42" },
]

const IGNORE = /^(tax|total|subtotal|balance|debit|credit|change|cash|visa|amount|payment)\b/i

export type Interpreted = {
  kind: "ignored" | "unknown" | "food" | "produce"
  name: string
  location: LocationName | null
  days: number | null
  unit: string
  qty: number | null
  needsName: boolean
  needsQuantity: boolean
}

export function interpretLine(raw: string): Interpreted {
  const cleaned = raw.trim()
  if (!cleaned || IGNORE.test(cleaned)) {
    return { kind: "ignored", name: cleaned || "Ignored", location: null, days: null, unit: "", qty: null, needsName: false, needsQuantity: false }
  }
  const lower = cleaned.toLowerCase()
  const food = CATALOG.find((item) => item.keys.some((key) => lower.includes(key.trim())))
  if (!food) {
    return { kind: "unknown", name: `Code ${cleaned}`, location: null, days: null, unit: "item", qty: 1, needsName: true, needsQuantity: false }
  }
  if (food.produce) {
    return { kind: "produce", name: food.name, location: food.location, days: food.days, unit: food.unit, qty: null, needsName: false, needsQuantity: true }
  }
  return { kind: "food", name: food.name, location: food.location, days: food.days, unit: food.unit, qty: food.qty, needsName: false, needsQuantity: false }
}

export function sameFood(a: string, b: string) {
  const x = a.trim().toLowerCase()
  const y = b.trim().toLowerCase()
  if (!x || !y) return false
  if (x === y) return true
  const shorter = Math.min(x.length, y.length)
  if (shorter < 4) return false
  return x.includes(y) || y.includes(x)
}

export function soonLabel(days: number | null) {
  if (days === null) return "Needs a date"
  if (days <= 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `${days} days`
}

export function isSoon(days: number | null) {
  return days !== null && days <= 3
}

export type Recipe = {
  id: string
  title: string
  minutes: number
  sketch: string
  ingredients: { name: string; qty: string }[]
  steps: string[]
}

export const RECIPES: Recipe[] = [
  {
    id: "skillet",
    title: "Skillet chicken and spinach",
    minutes: 25,
    sketch: "skillet",
    ingredients: [
      { name: "Chicken thighs", qty: "1 lb" },
      { name: "Baby spinach", qty: "1 bag" },
    ],
    steps: [
      "Pat the chicken dry and salt it.",
      "Sear the thighs until cooked through, about 6 minutes a side.",
      "Lift the chicken out and wilt the spinach in the same pan.",
      "Slice the chicken and serve it on the spinach.",
    ],
  },
  {
    id: "scramble",
    title: "Spinach scramble",
    minutes: 10,
    sketch: "eggs",
    ingredients: [
      { name: "Baby spinach", qty: "a handful" },
      { name: "Eggs", qty: "2" },
      { name: "Whole milk", qty: "a splash" },
    ],
    steps: [
      "Whisk the eggs with a splash of milk.",
      "Wilt the spinach in a pan, then pour in the eggs.",
      "Scramble gently until just set.",
    ],
  },
  {
    id: "banana-toast",
    title: "Banana toast",
    minutes: 5,
    sketch: "toast",
    ingredients: [
      { name: "Wheat bread", qty: "1 slice" },
      { name: "Bananas", qty: "1" },
    ],
    steps: [
      "Toast the bread.",
      "Slice a banana over the top.",
      "Eat it now. Bananas do not wait.",
    ],
  },
  {
    id: "egg-toast",
    title: "Egg toast",
    minutes: 8,
    sketch: "toast",
    ingredients: [
      { name: "Wheat bread", qty: "1 slice" },
      { name: "Eggs", qty: "1" },
    ],
    steps: [
      "Toast the bread.",
      "Fry an egg in a little oil.",
      "Slide the egg onto the toast.",
    ],
  },
  {
    id: "rice-bowl",
    title: "Chicken rice bowl",
    minutes: 30,
    sketch: "bowl",
    ingredients: [
      { name: "Chicken thighs", qty: "1 lb" },
      { name: "Rice", qty: "1 cup" },
    ],
    steps: [
      "Cook the rice.",
      "Slice and sear the chicken.",
      "Serve the chicken over the rice.",
    ],
  },
  {
    id: "pasta",
    title: "Butter pasta",
    minutes: 15,
    sketch: "pot",
    ingredients: [
      { name: "Pasta", qty: "2 oz" },
      { name: "Butter", qty: "1 spoon" },
    ],
    steps: [
      "Boil the pasta.",
      "Toss it with butter.",
      "Salt it and eat.",
    ],
  },
  {
    id: "yogurt",
    title: "Banana yogurt cup",
    minutes: 3,
    sketch: "cup",
    ingredients: [
      { name: "Greek yogurt", qty: "1 cup" },
      { name: "Bananas", qty: "1" },
    ],
    steps: [
      "Spoon the yogurt into a bowl.",
      "Slice a banana on top.",
      "Eat it cold.",
    ],
  },
  {
    id: "tortilla",
    title: "Cheddar tortilla",
    minutes: 8,
    sketch: "pan",
    ingredients: [
      { name: "Tortillas", qty: "1" },
      { name: "Cheddar", qty: "a handful" },
    ],
    steps: [
      "Warm a tortilla in a pan.",
      "Add cheddar and fold it.",
      "Cook until the cheese melts.",
    ],
  },
]

export type PantryLike = { name: string; daysLeft: number | null; location: LocationName | null; qty: number | null; unit: string }

export function findItem<T extends { name: string }>(pantry: T[], ingredient: string) {
  return pantry.find((item) => sameFood(item.name, ingredient))
}

export function recipeMatch<T extends PantryLike>(recipe: Recipe, pantry: T[]) {
  const rows = recipe.ingredients.map((ingredient) => {
    const item = findItem(pantry, ingredient.name)
    return { ...ingredient, item: item ?? null }
  })
  const have = rows.filter((row) => row.item).length
  const soon = rows.filter((row) => row.item && isSoon(row.item.daysLeft))
  const soonest = soon
    .map((row) => row.item)
    .filter((item): item is NonNullable<typeof item> => !!item)
    .sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99))[0]
  let score = 0
  for (const row of rows) {
    if (!row.item) {
      score -= 2
      continue
    }
    if (isSoon(row.item.daysLeft)) score += 12 - (row.item.daysLeft ?? 0)
    else score += 2
  }
  return { rows, have, total: rows.length, soon, soonest, score, full: have === rows.length }
}

export function rankedRecipes<T extends PantryLike>(pantry: T[]) {
  return RECIPES.map((recipe) => ({ recipe, match: recipeMatch(recipe, pantry) })).sort((a, b) => b.match.score - a.match.score)
}

export function usesSoonFood<T extends PantryLike>(recipe: Recipe, pantry: T[]) {
  return recipeMatch(recipe, pantry).soon.length > 0
}

export type Tip = {
  id: string
  topic: "eat" | "store" | "balance"
  title: string
  text: string
  match: string
}

export const TIPS: Tip[] = [
  { id: "soon", topic: "eat", title: "Eat the closest date first", text: "If something expires tomorrow, cook that before you open a new package.", match: "" },
  { id: "balance", topic: "balance", title: "A simple plate", text: "Build a meal from what you already have: a protein, something green, and a starch.", match: "" },
  { id: "bananas", topic: "store", title: "Bananas", text: "Keep bananas on the counter, away from other fruit, until they spot.", match: "banana" },
  { id: "spinach", topic: "store", title: "Leafy greens", text: "Keep spinach dry in the fridge. A damp bag makes it slimy faster.", match: "spinach" },
  { id: "chicken", topic: "store", title: "Raw chicken", text: "Chicken belongs in the fridge and should be cooked within a day or two.", match: "chicken" },
  { id: "bread", topic: "store", title: "Bread", text: "Freeze the loaf and leave out only what you will eat in a couple of days.", match: "bread" },
  { id: "milk", topic: "store", title: "Milk", text: "Keep milk on a fridge shelf, not the door, so it stays cold.", match: "milk" },
  { id: "eggs", topic: "store", title: "Eggs", text: "Leave eggs in the carton in the fridge. The date on the carton is a guide.", match: "egg" },
]

export function tipForName(name: string) {
  const lower = name.toLowerCase()
  return TIPS.find((tip) => tip.match && lower.includes(tip.match)) ?? null
}

export function tipList(names: string[]) {
  const specific = TIPS.filter((tip) => tip.match && names.some((name) => name.toLowerCase().includes(tip.match)))
  const general = TIPS.filter((tip) => !tip.match)
  const list = specific.concat(general)
  return list.length ? list : TIPS
}
