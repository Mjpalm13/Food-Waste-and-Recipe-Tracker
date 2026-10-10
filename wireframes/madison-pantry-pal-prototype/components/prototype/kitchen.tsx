"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { CATALOG, findItem, isSoon, rankedRecipes, RECIPES, recipeMatch, soonLabel, type LocationName } from "@/lib/food"
import { useApp } from "@/lib/store"
import type { PantryItem } from "@/lib/types"
import { Bell, Heart, Pencil } from "lucide-react"
import { foodTip } from "@/components/prototype/meals"
import { ExpireBadge, Field, Header, LocationChips, Screen, Scroll, Sketch, Stepper, tap } from "@/components/prototype/parts"

function recipeBlurb(recipeId: string, pantry: PantryItem[]) {
  const recipe = RECIPES.find((item) => item.id === recipeId)
  if (!recipe) return ""
  const match = recipeMatch(recipe, pantry)
  if (match.soonest) return `Uses ${match.soonest.name.toLowerCase()} · ${soonLabel(match.soonest.daysLeft).toLowerCase()}`
  if (match.full) return "You have everything"
  return `You have ${match.have} of ${match.total}`
}

export function HomeScreen() {
  const { state, go, openItem, openRecipe, doReminder } = useApp()
  const soon = state.pantry.filter((item) => isSoon(item.daysLeft)).sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99))
  const ranked = rankedRecipes(state.pantry)
  const featured = state.pantry.length ? ranked[0] : null
  const rest = ranked.slice(1, 3)
  const locationReminder = state.reminders.find((reminder) => reminder.kind === "location" && !reminder.done)
  const detailCount = state.pantry.filter((item) => item.needsName || item.needsQuantity || item.daysLeft === null).length
  const bell = soon.length + state.reminders.filter((reminder) => !reminder.done).length

  if (state.pantry.length === 0) {
    return (
      <Screen>
        <Header
          title="Home"
          side={
            <Button type="button" variant="ghost" className="size-11! px-0" aria-label="Notifications" onClick={() => go("notifications")}>
              <Bell />
            </Button>
          }
        />
        <Scroll>
          <h2 className="text-3xl leading-tight font-extrabold">See what you have. Eat it before it goes bad.</h2>
          <p className="text-[#4a463f]">Your kitchen is empty. A receipt is the fast way in.</p>
          <Button type="button" className={tap} onClick={() => go("camera")}>
            Take a photo
          </Button>
          <Button type="button" variant="outline" className={tap} onClick={() => go("upload")}>
            Upload a picture
          </Button>
          <Button type="button" variant="outline" className={tap} data-testid="home-sample" onClick={() => go("sample")}>
            Use the sample receipt
          </Button>
          <Button type="button" variant="ghost" className="h-11! font-semibold" onClick={() => go("add-item")}>
            Or type in one food
          </Button>
        </Scroll>
      </Screen>
    )
  }

  return (
    <Screen>
      <Header
        title="Home"
        side={
          <Button type="button" variant="ghost" className="relative size-11! px-0" aria-label="Notifications" onClick={() => go("notifications")}>
            <Bell />
            {bell > 0 ? <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9a4a12] px-1 text-[10px] font-bold text-white">{bell}</span> : null}
          </Button>
        }
      />
      <Scroll>
        <div className={state.tourStep === 1 ? "rounded-2xl ring-2 ring-primary ring-offset-4 ring-offset-background" : ""}>
          <h2 className="text-3xl leading-tight font-extrabold">Eat this soon</h2>
          <p className="mt-1 text-sm text-muted-foreground">Closest to going bad. This is the first thing we show you.</p>
          {soon.length === 0 ? (
            <p className="mt-3 text-sm">Nothing is close to expiring. Nice.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {soon.map((item) => (
                <li key={item.id}>
                  <button type="button" data-testid={`soon-${item.id}`} onClick={() => openItem(item.id)} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#b3ac9e] bg-card p-2 text-left">
                    <Sketch label={item.name.split(" ")[0].toLowerCase()} className="size-14 shrink-0" />
                    <span className="min-w-0 flex-1 font-bold">{item.name}</span>
                    <ExpireBadge days={item.daysLeft} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {locationReminder ? (
          <div className="rounded-xl bg-[#f6e2c6] p-3 text-sm text-[#7a3e0c]">
            <p className="font-bold">Set where food goes · {locationReminder.when}</p>
            <Button type="button" variant="outline" className="mt-2 h-11! bg-white" onClick={() => doReminder(locationReminder.id)}>
              Set places
            </Button>
          </div>
        ) : null}
        {detailCount > 0 ? (
          <Button type="button" variant="ghost" className="h-11! justify-start px-0 font-semibold" onClick={() => go("needs")}>
            Finish {detailCount} detail{detailCount === 1 ? "" : "s"} you skipped
          </Button>
        ) : null}

        {featured ? (
          <div className={state.tourStep === 2 ? "rounded-2xl ring-2 ring-primary ring-offset-4 ring-offset-background" : ""}>
            <h3 className="mb-2 text-lg font-extrabold">Cook with it</h3>
            <Card className="gap-3 border border-dashed border-[#b3ac9e] bg-card py-3 shadow-none ring-0">
              <div className="flex gap-3 px-3">
                <Sketch label={featured.recipe.sketch} className="size-20 shrink-0" />
                <div className="min-w-0">
                  <p className="font-extrabold">{featured.recipe.title}</p>
                  <p className="text-sm text-muted-foreground">{featured.recipe.minutes} min · {recipeBlurb(featured.recipe.id, state.pantry)}</p>
                </div>
              </div>
              <div className="px-3">
                <Button type="button" className={tap} data-testid="featured-recipe" onClick={() => openRecipe(featured.recipe.id, true)}>
                  Open recipe
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {rest.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {rest.map(({ recipe }) => (
              <li key={recipe.id}>
                <button type="button" onClick={() => openRecipe(recipe.id, false)} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-card p-2 text-left">
                  <Sketch label={recipe.sketch} className="size-14 shrink-0" />
                  <span>
                    <span className="block font-bold">{recipe.title}</span>
                    <span className="text-sm text-muted-foreground">{recipe.minutes} min · {recipeBlurb(recipe.id, state.pantry)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={state.tourStep === 3 ? "rounded-2xl ring-2 ring-primary ring-offset-4 ring-offset-background" : ""}>
          <Button type="button" variant="outline" className={tap} onClick={() => go("pantry")}>
            Manage food
          </Button>
        </div>
        <Button type="button" variant="ghost" className="h-11! font-semibold" onClick={() => go("add")}>
          Add another receipt
        </Button>
      </Scroll>
    </Screen>
  )
}

export function RecipesScreen() {
  const { state, setRecipeQuery, setRecipeSeg, openRecipe } = useApp()
  const query = state.recipeQuery.trim().toLowerCase()
  let list = rankedRecipes(state.pantry)
  if (state.recipeSeg === "all") list = RECIPES.map((recipe) => ({ recipe, match: recipeMatch(recipe, state.pantry) }))
  if (state.recipeSeg === "saved") list = list.filter(({ recipe }) => state.savedIds.includes(recipe.id))
  if (state.recipeSeg === "foryou" && state.pantry.length > 0) list = list.filter(({ match }) => match.have > 0)
  if (query) {
    list = list.filter(({ recipe }) => recipe.title.toLowerCase().includes(query) || recipe.ingredients.some((item) => item.name.toLowerCase().includes(query)))
  }
  const segs = [
    ["foryou", "For you"],
    ["all", "All"],
    ["saved", "Saved"],
  ] as const
  return (
    <Screen>
      <Header title="Recipes" />
      <Scroll>
        <Input value={state.recipeQuery} onChange={(event) => setRecipeQuery(event.target.value)} placeholder="Search recipes or foods" className="h-12! text-base" aria-label="Search recipes" />
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
          {segs.map(([id, label]) => (
            <Button key={id} type="button" variant={state.recipeSeg === id ? "default" : "ghost"} className="h-10!" onClick={() => setRecipeSeg(id)}>
              {label}
            </Button>
          ))}
        </div>
        {list.length === 0 ? <p className="text-sm text-muted-foreground">{state.recipeSeg === "saved" ? "No saved recipes yet. Open one and tap Save." : "Nothing matches that search."}</p> : null}
        <ul className="flex flex-col gap-2">
          {list.map(({ recipe, match }) => (
            <li key={recipe.id}>
              <button type="button" onClick={() => openRecipe(recipe.id, false)} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-card p-2 text-left">
                <Sketch label={recipe.sketch} className="size-16 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-bold">{recipe.title}</span>
                  <span className="block text-sm text-muted-foreground">{recipe.minutes} min · You have {match.have} of {match.total}</span>
                  {match.soonest ? <span className="mt-1 block"><ExpireBadge days={match.soonest.daysLeft} /></span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Scroll>
    </Screen>
  )
}

export function RecipeScreen() {
  const { state, back, toggleSave, startCook } = useApp()
  const recipe = RECIPES.find((item) => item.id === state.recipeId)
  if (!recipe) return null
  const match = recipeMatch(recipe, state.pantry)
  const saved = state.savedIds.includes(recipe.id)
  return (
    <Screen>
      <Header
        title="Recipe"
        onBack={back}
        side={
          <Button type="button" variant="ghost" className="size-11! px-0" aria-label={saved ? "Unsave recipe" : "Save recipe"} onClick={toggleSave}>
            <Heart className={saved ? "fill-primary text-primary" : ""} />
          </Button>
        }
      />
      <Scroll>
        <Sketch label={recipe.sketch} className="h-36" />
        <div>
          <h2 className="text-2xl font-extrabold">{recipe.title}</h2>
          <p className="text-sm text-muted-foreground">{recipe.minutes} min · {recipeBlurb(recipe.id, state.pantry)}</p>
        </div>
        <div>
          <h3 className="mb-2 font-extrabold">Ingredients</h3>
          <ul className="flex flex-col gap-2">
            {match.rows.map((row) => (
              <li key={row.name} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="font-semibold">{row.name}</span>
                  <span className="text-muted-foreground"> · {row.qty}</span>
                  {row.item?.location ? <span className="text-muted-foreground"> · {row.item.location}</span> : null}
                </span>
                <span className={row.item ? "text-primary" : "text-[#7a3e0c]"}>{row.item ? (isSoon(row.item.daysLeft) ? "Use soon" : "In pantry") : "Need to buy"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-extrabold">Steps</h3>
          <ol className="flex flex-col gap-2">
            {recipe.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <Button type="button" className={tap} data-testid="start-cook" onClick={startCook}>
          Start cooking
        </Button>
      </Scroll>
    </Screen>
  )
}

export function CookScreen() {
  const { state, cookBack, cookNext, finishCook } = useApp()
  const recipe = RECIPES.find((item) => item.id === state.recipeId)
  const [picked, setPicked] = useState<string[] | null>(null)
  if (!recipe) return null
  const last = state.cookStep >= recipe.steps.length - 1
  const owned = recipe.ingredients.map((item) => item.name).filter((name) => findItem(state.pantry, name))
  const chosen = picked ?? owned
  return (
    <Screen>
      <Header title={`Step ${state.cookStep + 1} of ${recipe.steps.length}`} onBack={cookBack} />
      <Scroll>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary" style={{ width: `${((state.cookStep + 1) / recipe.steps.length) * 100}%` }} />
        </div>
        <h2 className="text-2xl font-extrabold">{recipe.steps[state.cookStep]}</h2>
        {last ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Mark what you used. We&apos;ll update the pantry.</p>
            {owned.length === 0 ? <p className="text-sm">None of these are in the pantry.</p> : null}
            {owned.map((name) => {
              const on = chosen.includes(name)
              return (
                <Button key={name} type="button" variant={on ? "default" : "outline"} className="h-11! justify-start" onClick={() => setPicked(on ? chosen.filter((item) => item !== name) : chosen.concat(name))}>
                  {on ? "Used" : "Skip"} · {name}
                </Button>
              )
            })}
          </div>
        ) : null}
        {last ? (
          <Button type="button" className={tap} data-testid="finish-cook" onClick={() => finishCook(chosen)}>
            I made this
          </Button>
        ) : (
          <Button type="button" className={tap} data-testid="cook-next" onClick={cookNext}>
            Next step
          </Button>
        )}
      </Scroll>
    </Screen>
  )
}

export function CookedScreen() {
  const { state, tab, back, recordCooked } = useApp()
  return (
    <Screen>
      <Header title="You cooked" onBack={back} />
      <Scroll>
        <h2 className="text-3xl font-extrabold">Pantry updated.</h2>
        {state.cookChanges.length === 0 ? <p className="text-sm text-muted-foreground">Nothing was marked used.</p> : null}
        <ul className="flex flex-col gap-2">
          {state.cookChanges.map((change) => (
            <li key={change.name} className="rounded-xl border border-dashed bg-card p-3 text-sm font-semibold">{change.note}</li>
          ))}
        </ul>
        <Button type="button" className={tap} onClick={() => tab("home")}>
          Back to my kitchen
        </Button>
        <Button type="button" variant="outline" className={tap} onClick={recordCooked}>
          Save this in Meals
        </Button>
      </Scroll>
    </Screen>
  )
}

function pantryVisible(item: PantryItem, filter: string, query: string) {
  if (query && !item.name.toLowerCase().includes(query)) return false
  if (filter === "Expiring") return isSoon(item.daysLeft)
  if (filter === "Needs a detail") return item.needsName || item.needsQuantity || item.daysLeft === null || item.needsLocation
  if (filter === "No place") return !item.location
  if (["Fridge", "Freezer", "Cabinet", "Counter"].includes(filter)) return item.location === filter
  return true
}

export function PantryScreen() {
  const { state, setPantryQuery, setPantryFilter, openItem, go } = useApp()
  const filters = ["All", "Expiring", "Needs a detail", "Fridge", "Freezer", "Cabinet", "Counter", "No place"]
  const query = state.pantryQuery.trim().toLowerCase()
  const items = [...state.pantry].filter((item) => pantryVisible(item, state.pantryFilter, query)).sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99))
  return (
    <Screen>
      <Header title={`Pantry (${state.pantry.length})`} />
      <Scroll>
        <Input value={state.pantryQuery} onChange={(event) => setPantryQuery(event.target.value)} placeholder="Search your food" aria-label="Search pantry" className="h-12! text-base" />
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
          {filters.map((filter) => (
            <Button key={filter} type="button" variant={state.pantryFilter === filter ? "default" : "outline"} className="h-10! shrink-0 rounded-full" onClick={() => setPantryFilter(filter)}>
              {filter}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Sorted by what expires first. Open a food to change the count, date, or place.</p>
        {items.length === 0 ? (
          <Card className="border border-dashed bg-card py-4 shadow-none ring-0">
            <p className="px-4 font-bold">{state.pantry.length === 0 ? "Nothing here yet" : "Nothing in this filter"}</p>
            <p className="px-4 text-sm text-muted-foreground">Add a receipt, or type in one food.</p>
            <div className="flex flex-col gap-2 px-4">
              <Button type="button" className={tap} onClick={() => go("sample")}>Use the sample receipt</Button>
              <Button type="button" variant="outline" className={tap} onClick={() => go("add-item")}>Type in one food</Button>
            </div>
          </Card>
        ) : null}
        <ul>
          {items.map((item) => (
            <li key={item.id} className="border-b border-border">
              <button type="button" onClick={() => openItem(item.id)} className="flex min-h-16 w-full items-center gap-3 py-2 text-left">
                <Sketch label="" className="size-11 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{item.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {item.location ?? "No place yet"}
                    {item.qty !== null ? ` · ${item.qty} ${item.unit}` : item.needsQuantity ? " · Needs a count" : ""}
                  </span>
                </span>
                <ExpireBadge days={item.daysLeft} />
              </button>
            </li>
          ))}
        </ul>
      </Scroll>
    </Screen>
  )
}

export function ItemScreen() {
  const { state, back, openRecipe, askToss, useItem, go } = useApp()
  const item = state.pantry.find((food) => food.id === state.itemId)
  if (!item) return null
  const recipes = RECIPES.filter((recipe) => recipe.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(ingredient.name.toLowerCase())))
  return (
    <Screen>
      <Header title={item.name} onBack={back} side={<Button type="button" variant="ghost" className="size-11! px-0" aria-label="Edit" onClick={() => go("edit-item")}><Pencil /></Button>} />
      <Scroll>
        <Sketch label={item.name.split(" ")[0].toLowerCase()} className="h-32" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold">{item.name}</h2>
            <p className="text-sm text-muted-foreground">
              {item.location ?? "No place yet"}
              {item.qty !== null ? ` · ${item.qty} ${item.unit}` : ""}
            </p>
          </div>
          <ExpireBadge days={item.daysLeft} />
        </div>
        {foodTip(item.name) ? <p className="rounded-xl bg-accent p-3 text-sm text-accent-foreground"><b>Store it:</b> {foodTip(item.name)?.text}</p> : null}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" className={tap} onClick={useItem}>I used it</Button>
          <Button type="button" variant="outline" className={tap} onClick={askToss}>I tossed it</Button>
        </div>
        <h3 className="font-extrabold">Recipes that use this</h3>
        {recipes.length === 0 ? <p className="text-sm text-muted-foreground">No recipe uses this yet.</p> : null}
        <ul className="flex flex-col gap-2">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <button type="button" className="flex w-full items-center gap-3 rounded-xl border border-dashed bg-card p-2 text-left" onClick={() => openRecipe(recipe.id, isSoon(item.daysLeft))}>
                <Sketch label={recipe.sketch} className="size-14" />
                <span className="font-bold">{recipe.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </Scroll>
    </Screen>
  )
}

function ItemForm({
  initial,
  title,
  onSave,
  onBack,
}: {
  initial: PantryItem
  title: string
  onSave: (item: PantryItem) => void
  onBack: () => void
}) {
  const [name, setName] = useState(initial.name)
  const [qty, setQty] = useState(initial.qty ?? 1)
  const [unit, setUnit] = useState(initial.unit || "item")
  const [location, setLocation] = useState<LocationName | null>(initial.location)
  const [days, setDays] = useState(initial.daysLeft ?? 3)
  const [knowDate, setKnowDate] = useState(initial.daysLeft !== null)
  const [error, setError] = useState("")
  return (
    <Screen>
      <Header title={title} onBack={onBack} />
      <Scroll>
        <Field id="food-name" label="Name" value={name} onChange={setName} error={error} />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Count</p>
          <Stepper value={qty} onChange={setQty} label="Count" />
          <Input value={unit} onChange={(event) => setUnit(event.target.value)} aria-label="Unit" className="h-12! text-base" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Where it goes</p>
          <LocationChips value={location} allowEmpty onChange={setLocation} />
          <Button type="button" variant="ghost" className="h-11! self-start px-0" onClick={() => setLocation(null)}>
            No place yet
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Use within</p>
          {knowDate ? <Stepper value={days} onChange={setDays} label="Days" /> : <p className="text-sm text-muted-foreground">No date yet.</p>}
          <Button type="button" variant="outline" className="h-11!" onClick={() => setKnowDate((value) => !value)}>
            {knowDate ? "I don't know the date" : "Set a date"}
          </Button>
        </div>
        <Button
          type="button"
          className={tap}
          data-testid="save-food"
          onClick={() => {
            if (name.trim().length < 2) {
              setError("Give the food a name.")
              return
            }
            onSave({
              ...initial,
              name: name.trim(),
              qty,
              unit: unit.trim() || "item",
              location,
              daysLeft: knowDate ? days : null,
              needsName: false,
              needsQuantity: false,
              needsLocation: !location,
            })
          }}
        >
          Save
        </Button>
      </Scroll>
    </Screen>
  )
}

export function EditItemScreen() {
  const { state, back, saveItem } = useApp()
  const item = state.pantry.find((food) => food.id === state.itemId)
  if (!item) return null
  return <ItemForm initial={item} title="Edit food" onBack={back} onSave={saveItem} />
}

export function AddItemScreen() {
  const { back, addItem } = useApp()
  const [name, setName] = useState("")
  const [qty, setQty] = useState(1)
  const [unit, setUnit] = useState("item")
  const [location, setLocation] = useState<LocationName | null>(null)
  const [days, setDays] = useState(3)
  const [knowDate, setKnowDate] = useState(true)
  const [error, setError] = useState("")
  const suggestions = CATALOG.filter((food) => food.name.toLowerCase().includes(name.trim().toLowerCase())).slice(0, 6)
  function applySuggestion(foodName: string) {
    const food = CATALOG.find((item) => item.name === foodName)
    setName(foodName)
    if (!food) return
    setUnit(food.unit)
    setLocation(food.location)
    setDays(food.days)
    if (food.qty) setQty(food.qty)
  }
  return (
    <Screen>
      <Header title="Type in a food" onBack={back} />
      <Scroll>
        <Field id="add-name" label="Name" value={name} onChange={setName} error={error} />
        <div className="flex gap-2 overflow-x-auto">
          {suggestions.map((food) => (
            <Button key={food.name} type="button" variant="outline" className="h-10! shrink-0 rounded-full" onClick={() => applySuggestion(food.name)}>
              {food.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Count</p>
          <Stepper value={qty} onChange={setQty} label="Count" />
          <Input value={unit} onChange={(event) => setUnit(event.target.value)} aria-label="Unit" className="h-12! text-base" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Where it goes</p>
          <LocationChips value={location} allowEmpty onChange={setLocation} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Use within</p>
          {knowDate ? <Stepper value={days} onChange={setDays} label="Days" /> : <p className="text-sm text-muted-foreground">No date yet. You can add it later.</p>}
          <Button type="button" variant="outline" className="h-11!" onClick={() => setKnowDate((value) => !value)}>
            {knowDate ? "I don't know the date" : "Set a date"}
          </Button>
        </div>
        <Button
          type="button"
          className={tap}
          data-testid="save-food"
          onClick={() => {
            if (name.trim().length < 2) {
              setError("Give the food a name.")
              return
            }
            addItem({
              name: name.trim(),
              qty,
              unit: unit.trim() || "item",
              location,
              daysLeft: knowDate ? days : null,
              needsName: false,
              needsQuantity: false,
              needsLocation: !location,
            })
          }}
        >
          Add to pantry
        </Button>
      </Scroll>
    </Screen>
  )
}

export function NeedsScreen() {
  const { state, back, patchItem } = useApp()
  const items = state.pantry.filter((item) => item.needsName || item.needsQuantity || item.daysLeft === null)
  return (
    <Screen>
      <Header title="Finish details" onBack={back} />
      <Scroll>
        {items.length === 0 ? <p className="text-sm">You&apos;re caught up.</p> : null}
        {items.map((item) => (
          <NeedCard key={item.id} item={item} onSave={patchItem} />
        ))}
      </Scroll>
    </Screen>
  )
}

function NeedCard({ item, onSave }: { item: PantryItem; onSave: (item: PantryItem) => void }) {
  const [name, setName] = useState(item.needsName ? "" : item.name)
  const [qty, setQty] = useState(item.qty ?? 1)
  const [days, setDays] = useState(item.daysLeft ?? 3)
  return (
    <Card className="gap-3 border border-dashed bg-card py-3 shadow-none ring-0">
      <div className="px-3">
        <p className="font-bold">{item.needsName ? item.name : item.name}</p>
        <p className="text-xs text-muted-foreground">{item.needsName ? "Name it" : ""}{item.needsQuantity ? " Count it" : ""}{item.daysLeft === null ? " Add a date" : ""}</p>
      </div>
      {item.needsName ? <div className="px-3"><Input value={name} onChange={(event) => setName(event.target.value)} aria-label="Food name" className="h-12! text-base" /></div> : null}
      {item.needsQuantity ? <div className="px-3"><Stepper value={qty} onChange={setQty} label="Count" /></div> : null}
      {item.daysLeft === null ? <div className="px-3"><Stepper value={days} onChange={setDays} label="Days to keep" /></div> : null}
      <div className="px-3">
        <Button
          type="button"
          className={tap}
          disabled={item.needsName && name.trim().length < 2}
          onClick={() =>
            onSave({
              ...item,
              name: item.needsName ? name.trim() : item.name,
              qty: item.needsQuantity ? qty : item.qty,
              daysLeft: item.daysLeft === null ? days : item.daysLeft,
              needsName: false,
              needsQuantity: false,
            })
          }
        >
          Save {item.needsName ? "name" : "detail"}
        </Button>
      </div>
    </Card>
  )
}

export function FixLocationsScreen() {
  const { state, back, setItemLocation, finishLocations } = useApp()
  const items = state.pantry.filter((item) => !item.location)
  return (
    <Screen>
      <Header title="Set places" onBack={back} />
      <Scroll>
        <p className="text-sm text-muted-foreground">Put each food where you will look for it. You can leave some blank.</p>
        {items.length === 0 ? <p className="text-sm">Every food already has a place.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-2">
            <p className="font-bold">{item.name}</p>
            <LocationChips value={item.location} onChange={(location) => location && setItemLocation(item.id, location)} />
          </div>
        ))}
        <Button type="button" className={tap} onClick={() => finishLocations(false)}>Save places</Button>
        <Button type="button" variant="outline" className={tap} onClick={() => finishLocations(true)}>Stop reminding me</Button>
      </Scroll>
    </Screen>
  )
}

export function NotificationsScreen() {
  const { state, back, openItem, doReminder, go } = useApp()
  const soon = state.pantry.filter((item) => isSoon(item.daysLeft))
  const reminders = state.reminders.filter((reminder) => !reminder.done)
  const empty = soon.length === 0 && reminders.length === 0
  return (
    <Screen>
      <Header title="Notifications" onBack={back} />
      <Scroll>
        {empty ? <p className="text-sm text-muted-foreground">Nothing to catch up on.</p> : null}
        {soon.map((item) => (
          <button key={item.id} type="button" onClick={() => openItem(item.id)} className="rounded-xl border border-dashed bg-card p-3 text-left">
            <span className="block font-bold">{item.name} · {soonLabel(item.daysLeft)}</span>
            <span className="text-sm text-muted-foreground">Open it, then pick a recipe that uses it.</span>
          </button>
        ))}
        {reminders.map((reminder) => (
          <button key={reminder.id} type="button" onClick={() => doReminder(reminder.id)} className="rounded-xl border border-dashed bg-card p-3 text-left">
            <span className="block font-bold">{reminder.kind === "location" ? "Set where food goes" : "Finish skipped details"}</span>
            <span className="text-sm text-muted-foreground">{reminder.when}</span>
          </button>
        ))}
        <Button type="button" variant="ghost" className="h-11! font-semibold" onClick={() => go("reminders")}>All reminders</Button>
      </Scroll>
    </Screen>
  )
}

export function RemindersScreen() {
  const { state, back, doReminder, dismissReminder } = useApp()
  return (
    <Screen>
      <Header title="Reminders" onBack={back} />
      <Scroll>
        {state.reminders.length === 0 ? <p className="text-sm text-muted-foreground">No reminders yet. You can set one when you skip places on a receipt.</p> : null}
        {state.reminders.map((reminder) => (
          <div key={reminder.id} className="rounded-xl border border-dashed bg-card p-3">
            <p className="font-bold">{reminder.kind === "location" ? "Where food goes" : "Finish details"}</p>
            <p className="text-sm text-muted-foreground">{reminder.when}{reminder.done ? " · done" : ""}</p>
            {reminder.done ? null : (
              <div className="mt-2 flex gap-2">
                <Button type="button" className="h-11! flex-1" onClick={() => doReminder(reminder.id)}>Do it now</Button>
                <Button type="button" variant="outline" className="h-11! flex-1" onClick={() => dismissReminder(reminder.id)}>Dismiss</Button>
              </div>
            )}
          </div>
        ))}
      </Scroll>
    </Screen>
  )
}

export function ProfileScreen() {
  const { state, go, askLogout, askReset, replayTour } = useApp()
  const initial = (state.session?.name ?? "?").slice(0, 1).toUpperCase()
  return (
    <Screen>
      <Header title="Profile" />
      <Scroll>
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full border border-dashed bg-accent text-xl font-extrabold">{initial}</div>
          <div>
            <p className="text-xl font-extrabold">{state.session?.name ?? "No account yet"}</p>
            <p className="text-sm text-muted-foreground">{state.session?.email ?? "You can make one in a minute."}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat n={state.pantry.length} label="in pantry" />
          <Stat n={state.used} label="used up" />
          <Stat n={state.tossed} label="tossed" />
        </div>
        <Separator />
        <Row label="Notifications" onClick={() => go("notifications")} />
        <Row label="Reminders" onClick={() => go("reminders")} />
        {state.session ? <Row label="Edit account" onClick={() => go("edit-profile")} /> : state.registered ? <Row label="Log in" onClick={() => go("login")} /> : <Row label="Make an account" onClick={() => go("account")} />}
        {state.pantry.length > 0 ? <Row label="Show me around again" onClick={replayTour} /> : null}
        <Row label="About this draft" onClick={() => go("about")} />
        <Row label="Design library" onClick={() => go("parts")} />
        <Row label="Reset this draft" onClick={askReset} />
        {state.session ? (
          <Button type="button" variant="outline" className={tap} onClick={askLogout}>Log out</Button>
        ) : null}
      </Scroll>
    </Screen>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-2">
      <p className="text-xl font-extrabold">{n}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Row({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center justify-between border-b border-border text-left font-semibold">
      {label}
      <span aria-hidden="true">›</span>
    </button>
  )
}

export function EditProfileScreen() {
  const { state, back, updateAccount } = useApp()
  const [name, setName] = useState(state.registered?.name ?? "")
  const [email, setEmail] = useState(state.registered?.email ?? "")
  const [password, setPassword] = useState(state.registered?.password ?? "")
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  return (
    <Screen>
      <Header title="Edit account" onBack={back} />
      <Scroll>
        <Field id="edit-name" label="Name" value={name} onChange={setName} error={errors.name} />
        <Field id="edit-email" label="Email" value={email} onChange={setEmail} error={errors.email} type="email" />
        <Field id="edit-password" label="Password" value={password} onChange={setPassword} error={errors.password} type="password" />
        <Button
          type="button"
          className={tap}
          onClick={() => {
            const next: typeof errors = {}
            if (name.trim().length < 2) next.name = "Tell us what to call you."
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter an email like name@school.edu."
            if (password.length < 8) next.password = "Use at least 8 characters."
            setErrors(next)
            if (Object.keys(next).length) return
            updateAccount({ name: name.trim(), email: email.trim(), password })
          }}
        >
          Save account
        </Button>
      </Scroll>
    </Screen>
  )
}

export function AboutScreen() {
  const { back, openNotice, openGoal, go } = useApp()
  return (
    <Screen>
      <Header title="About this draft" onBack={back} />
      <Scroll>
        <p className="note-font text-2xl text-[#5a554c]">Rough draft, not the finished app.</p>
        <p className="text-sm">Boxes stand in for photos. The receipt reader uses a practice grocery list so you can try every case: a known code, produce that needs a count, a code we cannot read, and a tax line we skip.</p>
        <p className="text-sm">Your account stays in this browser only. There is no server.</p>
        <p className="text-sm">The home screen always leads with food that is about to go bad, then a recipe that uses it. Meals is a separate tab for what you ate and what is left. Tips stay short so they can grow later. Sharing recipes, writing your own, and diet settings are left out so they do not compete with the pantry.</p>
        <Button type="button" className={tap} onClick={openNotice}>Read the draft notice</Button>
        <Button type="button" variant="outline" className={tap} onClick={openGoal}>Show my goal</Button>
        <Button type="button" variant="ghost" className="h-11! font-semibold" onClick={() => go("parts")}>See the parts this app reuses</Button>
      </Scroll>
    </Screen>
  )
}

export function PartsScreen() {
  const { back } = useApp()
  return (
    <Screen>
      <Header title="Design library" onBack={back} />
      <Scroll>
        <p className="text-sm text-muted-foreground">Every screen is built from these parts. Sage means the one main action. Amber means use it soon.</p>
        <Button type="button" className={tap}>Primary action</Button>
        <Button type="button" variant="outline" className={tap}>Secondary</Button>
        <div className="flex gap-2">
          <ExpireBadge days={1} />
          <ExpireBadge days={12} />
        </div>
        <Sketch label="photo" className="h-20" />
        <LocationChips value="Fridge" onChange={() => undefined} />
        <a className="text-sm font-semibold text-primary underline" href="/library">Open the full library page</a>
      </Scroll>
    </Screen>
  )
}
