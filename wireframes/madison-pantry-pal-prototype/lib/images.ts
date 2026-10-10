const FOOD: Record<string, string> = {
  milk: "/food/milk.jpg",
  "whole milk": "/food/milk.jpg",
  chicken: "/food/chicken.jpg",
  "chicken thighs": "/food/chicken.jpg",
  spinach: "/food/spinach.jpg",
  "baby spinach": "/food/spinach.jpg",
  egg: "/food/eggs.jpg",
  eggs: "/food/eggs.jpg",
  bread: "/food/bread.jpg",
  "wheat bread": "/food/bread.jpg",
  banana: "/food/bananas.jpg",
  bananas: "/food/bananas.jpg",
  garlic: "/food/garlic.jpg",
  yogurt: "/food/yogurt.jpg",
  "greek yogurt": "/food/yogurt.jpg",
  rice: "/food/rice.jpg",
  butter: "/food/butter.jpg",
  cheddar: "/food/cheddar.jpg",
  cheese: "/food/cheddar.jpg",
  pasta: "/food/pasta.jpg",
  tortilla: "/food/tortillas.jpg",
  tortillas: "/food/tortillas.jpg",
  onion: "/food/onion.jpg",
  tomato: "/food/tomatoes.jpg",
  tomatoes: "/food/tomatoes.jpg",
  "orange juice": "/food/orange-juice.jpg",
  oj: "/food/orange-juice.jpg",
}

const RECIPE: Record<string, string> = {
  skillet: "/recipes/skillet.jpg",
  scramble: "/recipes/scramble.jpg",
  toast: "/recipes/toast.jpg",
  "egg-toast": "/recipes/egg-toast.jpg",
  bowl: "/recipes/bowl.jpg",
  pot: "/recipes/pot.jpg",
  cup: "/recipes/cup.jpg",
  pan: "/recipes/pan.jpg",
}

function normalize(label: string) {
  return label.trim().toLowerCase()
}

export function imageForLabel(label: string): string | null {
  const key = normalize(label)
  if (!key) return null
  if (RECIPE[key]) return RECIPE[key]
  if (FOOD[key]) return FOOD[key]
  for (const [name, src] of Object.entries(FOOD)) {
    if (key.includes(name) || name.includes(key)) return src
  }
  return null
}
