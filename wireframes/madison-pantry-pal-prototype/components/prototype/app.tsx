"use client"

import { AccountScreen, AddDraftScreen, AddedScreen, CameraScreen, EditDraftScreen, LocationScreen, LoginScreen, ProduceScreen, ReadingScreen, RemindScreen, ReviewScreen, SampleScreen, UnknownScreen, UploadScreen, ValueScreen } from "@/components/prototype/receipt"
import { AboutScreen, AddItemScreen, CookedScreen, CookScreen, EditItemScreen, EditProfileScreen, FixLocationsScreen, HomeScreen, ItemScreen, NeedsScreen, NotificationsScreen, PantryScreen, PartsScreen, ProfileScreen, RecipeScreen, RecipesScreen, RemindersScreen } from "@/components/prototype/kitchen"
import { LogMealScreen, MealLeftScreen, MealsScreen } from "@/components/prototype/meals"
import { Phone } from "@/components/prototype/shell"
import { AppProvider, useApp } from "@/lib/store"

function Screens() {
  const { state } = useApp()
  switch (state.screen) {
    case "value":
    case "add":
      return <ValueScreen />
    case "camera":
      return <CameraScreen />
    case "upload":
      return <UploadScreen />
    case "sample":
      return <SampleScreen />
    case "reading":
      return <ReadingScreen />
    case "review":
      return <ReviewScreen />
    case "edit-draft":
      return <EditDraftScreen />
    case "add-draft":
      return <AddDraftScreen />
    case "unknown":
      return <UnknownScreen />
    case "produce":
      return <ProduceScreen />
    case "location":
      return <LocationScreen />
    case "remind-when":
      return <RemindScreen />
    case "added":
      return <AddedScreen />
    case "account":
      return <AccountScreen />
    case "login":
      return <LoginScreen />
    case "home":
      return <HomeScreen />
    case "recipes":
      return <RecipesScreen />
    case "recipe":
      return <RecipeScreen />
    case "cook":
      return <CookScreen />
    case "cooked":
      return <CookedScreen />
    case "pantry":
      return <PantryScreen />
    case "item":
      return <ItemScreen />
    case "edit-item":
      return <EditItemScreen />
    case "add-item":
      return <AddItemScreen />
    case "needs":
      return <NeedsScreen />
    case "fix-locations":
      return <FixLocationsScreen />
    case "notifications":
      return <NotificationsScreen />
    case "profile":
      return <ProfileScreen />
    case "edit-profile":
      return <EditProfileScreen />
    case "reminders":
      return <RemindersScreen />
    case "about":
      return <AboutScreen />
    case "parts":
      return <PartsScreen />
    case "meals":
      return <MealsScreen />
    case "log-meal":
      return <LogMealScreen />
    case "meal-left":
      return <MealLeftScreen />
    default:
      return <HomeScreen />
  }
}

export default function PrototypeApp() {
  return (
    <AppProvider>
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#e4ddd0] px-3 py-4 text-[#2b2a27]">
        <p className="text-center text-sm">
          Pantry Pal · low-fidelity phone draft ·{" "}
          <a className="font-semibold underline" href="/library">
            Design library
          </a>
        </p>
        <Phone>
          <Screens />
        </Phone>
      </main>
    </AppProvider>
  )
}
