"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { tipForName, tipList } from "@/lib/food"
import { useApp } from "@/lib/store"
import type { PantryItem } from "@/lib/types"
import { Field, Header, Screen, Scroll, Stepper, tap } from "@/components/prototype/parts"

const SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const

function whenLabel(at: number) {
  const date = new Date(at)
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  const today = new Date().toDateString() === date.toDateString()
  if (today) return `Today · ${time}`
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${time}`
}

export function TipCard({ names }: { names: string[] }) {
  const { state, nextTip } = useApp()
  const list = tipList(names)
  const tip = list[state.tipIndex % list.length]
  return (
    <div className="rounded-xl border border-dashed border-[#b3ac9e] bg-[#fbf9f4] p-3">
      <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Tip · {tip.topic}</p>
      <p className="mt-1 font-bold">{tip.title}</p>
      <p className="text-sm text-[#4a463f]">{tip.text}</p>
      <Button type="button" variant="ghost" className="mt-1 h-10! px-0 font-semibold" onClick={nextTip}>
        Another tip
      </Button>
    </div>
  )
}

export function MealsScreen() {
  const { state, startLog } = useApp()
  const names = state.pantry.map((item) => item.name)
  return (
    <Screen>
      <Header title="Meals" />
      <Scroll>
        <h2 className="text-3xl leading-tight font-extrabold">What you ate</h2>
        <p className="text-sm text-muted-foreground">Log a meal, mark what came out of the pantry, and confirm what is left.</p>
        <Button type="button" className={tap} data-testid="log-meal" onClick={startLog}>
          Log a meal
        </Button>
        {state.meals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing logged yet. Breakfast, lunch, dinner, or a snack all land here.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {state.meals.map((meal) => (
              <li key={meal.id} className="rounded-xl border border-dashed border-border bg-card p-3">
                <p className="text-xs font-bold text-muted-foreground">{whenLabel(meal.at)}</p>
                <p className="font-extrabold">{meal.slot}{meal.note ? ` · ${meal.note}` : ""}</p>
                {meal.foods.length === 0 ? <p className="text-sm text-muted-foreground">No pantry foods marked.</p> : null}
                <ul className="mt-1">
                  {meal.foods.map((food) => (
                    <li key={food.name} className="text-sm">
                      <span className="font-semibold">{food.name}</span>
                      <span className="text-muted-foreground"> · {food.leftLabel}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        <TipCard names={names} />
      </Scroll>
    </Screen>
  )
}

export function LogMealScreen() {
  const { state, back, setMealSlot, setMealNote, toggleMealPick, beginMealCheck } = useApp()
  const foods = [...state.pantry].sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99))
  return (
    <Screen>
      <Header title="Log a meal" onBack={back} />
      <Scroll>
        <p className="text-sm text-muted-foreground">Pick the foods you used. Next we ask how much is still left.</p>
        <div className="grid grid-cols-2 gap-2">
          {SLOTS.map((slot) => (
            <Button key={slot} type="button" variant={state.mealSlot === slot ? "default" : "outline"} className="h-11!" aria-pressed={state.mealSlot === slot} onClick={() => setMealSlot(slot)}>
              {slot}
            </Button>
          ))}
        </div>
        {foods.length === 0 ? <p className="text-sm">Your pantry is empty. You can still write down what you ate.</p> : null}
        <ul className="flex flex-col gap-2">
          {foods.map((item) => {
            const on = state.mealPicks.includes(item.id)
            return (
              <li key={item.id}>
                <label className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-dashed border-border bg-card px-3 text-left">
                  <Checkbox checked={on} aria-label={item.name} className="size-5" onCheckedChange={() => toggleMealPick(item.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{item.name}</span>
                    <span className="text-sm text-muted-foreground">{item.qty !== null ? `${item.qty} ${item.unit}` : "Count not set"}</span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
        <Field id="meal-note" label="Anything else? Optional" value={state.mealNote} onChange={setMealNote} />
        <Button type="button" className={tap} data-testid="meal-continue" onClick={beginMealCheck}>
          Continue
        </Button>
      </Scroll>
    </Screen>
  )
}

export function MealLeftScreen() {
  const { state, back } = useApp()
  const item = state.pantry.find((food) => food.id === state.promptId)
  if (!item) return null
  const place = state.mealAnswers.length + 1
  const total = state.mealAnswers.length + state.mealQueue.length
  return <LeftCheck key={item.id} item={item} place={place} total={total} onBack={back} />
}

function LeftCheck({ item, place, total, onBack }: { item: PantryItem; place: number; total: number; onBack: () => void }) {
  const { confirmLeft } = useApp()
  const known = item.qty !== null
  const suggested = known ? Math.max(0, (item.qty ?? 0) - 1) : 0
  const [left, setLeft] = useState(suggested)
  const [editing, setEditing] = useState(!known || suggested === 0)
  const unit = item.unit || "left"
  return (
    <Screen>
      <Header title={`Food ${place} of ${total}`} onBack={onBack} />
      <Scroll>
        <p className="text-sm text-muted-foreground">This checks the pantry after the meal. You can change the number.</p>
        <div className="rounded-2xl border border-foreground bg-popover p-4">
          {known && suggested > 0 ? (
            <>
              <h2 className="text-2xl font-extrabold">Do you have {suggested} {unit} left?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.name} had {item.qty} {unit}. This assumes you used 1.
              </p>
            </>
          ) : known ? (
            <>
              <h2 className="text-2xl font-extrabold">Did you finish the {item.name.toLowerCase()}?</h2>
              <p className="mt-1 text-sm text-muted-foreground">There was {item.qty} {unit} before this meal.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold">How many {item.name.toLowerCase()} are left?</h2>
              <p className="mt-1 text-sm text-muted-foreground">We never got a count for this one.</p>
            </>
          )}
          {editing ? (
            <div className="mt-4">
              <Stepper value={left} min={0} onChange={setLeft} label={`How many ${item.name} are left`} />
              <p className="mt-2 text-sm text-muted-foreground">{left === 0 ? "None left. It will leave the pantry." : `${left} ${unit} will stay in the pantry.`}</p>
            </div>
          ) : null}
        </div>
        {known && suggested > 0 && !editing ? (
          <Button type="button" className={tap} data-testid="left-yes" onClick={() => confirmLeft(suggested)}>
            Yes, {suggested} left
          </Button>
        ) : null}
        {editing ? (
          <Button type="button" className={tap} data-testid="left-save" onClick={() => confirmLeft(left)}>
            {left === 0 ? "None left" : `Save ${left} left`}
          </Button>
        ) : (
          <Button type="button" variant="outline" className={tap} data-testid="left-change" onClick={() => setEditing(true)}>
            Change the number
          </Button>
        )}
        {known && suggested > 0 ? (
          <Button type="button" variant="ghost" className="h-11! font-semibold" data-testid="left-none" onClick={() => confirmLeft(0)}>
            None left
          </Button>
        ) : null}
      </Scroll>
    </Screen>
  )
}

export function foodTip(name: string) {
  return tipForName(name)
}
