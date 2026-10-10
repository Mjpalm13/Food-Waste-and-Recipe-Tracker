# Pantry Pal — low-fidelity draft

A clickable phone prototype for a college student who shares a kitchen and does not have time to check expiration dates. The job of the app is to show what food is in the home, what has to be eaten soon, and a recipe that uses that food. A receipt is the fast way to get food in.

This draft is separate from Senah’s wireframe in the group repo (`wireframes/senah-pantry-pal-prototype`). Do not replace that folder. If the group wants this version in GitHub, copy this project into a new folder, such as `drafts/pantry-pal/`.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4179](http://127.0.0.1:4179). The design library is at [http://127.0.0.1:4179/library](http://127.0.0.1:4179/library).

The account and pantry stay in this browser only. There is no server. Reset from Profile → Reset this draft.

## What a new person can do

The first screen says the job in one line: see what you have, and eat it before it goes bad. A modal says this is a rough draft and gives the goal. Onboarding can be skipped. The tour can be skipped.

Three ways to add a receipt, and all of them work:

- Take a photo, using the device camera when the browser allows it
- Upload a picture from the device
- Use the built-in sample receipt

The sample receipt is there so the whole flow can be graded on a laptop. It includes foods the practice reader knows, bananas that ask for a count, a store code it cannot read, and a tax line it ignores. A photo you take is shown on the next screen. This draft then reads that photo with the same practice list, and it says so in plain language.

After the list, you can name the unknown line or leave it for later, and you can count the bananas or count them later. Then you can save where the food goes, skip that step, or set a reminder for tonight, tomorrow morning, or the weekend.

The account screen takes a name, an email, and a password (at least 8 characters). You can skip it, log out, log back in, and edit it. Wrong passwords are rejected.

Home, once food is in, leads with what expires soon and one recipe that uses it. The bottom bar is Home, Recipes, Pantry, Meals, and Profile. Meals is where you log what you ate. Each food you mark asks how much is left, for example “Do you have 3 bananas left?” A short tip sits on that screen, and a storage tip shows on a food when we know one. You can also type in one food, cook a recipe, mark food used or tossed, and finish skipped details from the bell.

## Note for the submission comment

This prototype keeps one job in front of the user: know what is in the kitchen and what to eat before it goes bad. The first screen says that before it asks for a receipt. After food is in, Home leads with the food that expires soon and a recipe that uses it. Receipt scanning is the way food gets in, not the headline. Place, count, and name details can be skipped or reminded later so they do not block that view. Recipe sharing, writing a recipe from scratch, and diet preferences are left off the main path so they do not compete with the pantry.
