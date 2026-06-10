export type Note = {
  id: string
  title: string
  body: string
  category: string
  tags: string[]
  updated: string
  pinned?: boolean
  color: string
}

export const categories = [
  "All Notes",
  "Personal",
  "Family",
  "Work",
  "Ideas",
  "Recipes",
]

export const initialNotes: Note[] = [
  {
    id: "n1",
    title: "Summer trip checklist",
    body: "Pack sunscreen, beach towels, and the first-aid kit. Book the cabin by June 1st. Don't forget Leo's swim goggles and Ivy's favorite book for the drive.\n\nConfirm pet sitter for the dog.",
    category: "Family",
    tags: ["travel", "summer"],
    updated: "2m ago",
    pinned: true,
    color: "bg-chart-1",
  },
  {
    id: "n2",
    title: "Emergency contacts",
    body: "Dr. Patel (pediatrician): 555-0142\nPlumber: 555-0199\nGrandma Rose: 555-0123\nSchool office: 555-0177\n\nKeep a printed copy on the fridge.",
    category: "Family",
    tags: ["important"],
    updated: "1h ago",
    pinned: true,
    color: "bg-chart-5",
  },
  {
    id: "n3",
    title: "Grandma's lasagna recipe",
    body: "Layers: pasta, ricotta, mozzarella, meat sauce. Bake at 375°F for 45 minutes. Let it rest 10 minutes before serving.\n\nSecret: a pinch of nutmeg in the ricotta.",
    category: "Recipes",
    tags: ["dinner", "italian"],
    updated: "3h ago",
    color: "bg-chart-3",
  },
  {
    id: "n4",
    title: "Book outline: The Quiet Garden",
    body: "Chapter 1 — the move to the countryside.\nChapter 2 — discovering the overgrown garden.\nChapter 3 — meeting the old gardener next door.\n\nTheme: patience and growth.",
    category: "Ideas",
    tags: ["writing", "project"],
    updated: "Yesterday",
    color: "bg-chart-4",
  },
  {
    id: "n5",
    title: "Weekly meal plan",
    body: "Mon: Tacos\nTue: Pasta night\nWed: Stir fry\nThu: Leftovers\nFri: Homemade pizza\nSat: BBQ\nSun: Roast dinner",
    category: "Family",
    tags: ["food", "planning"],
    updated: "Yesterday",
    color: "bg-chart-2",
  },
  {
    id: "n6",
    title: "Q3 project goals",
    body: "Ship the new onboarding flow. Improve load time by 30%. Run two user research sessions.",
    category: "Work",
    tags: ["goals"],
    updated: "2 days ago",
    color: "bg-chart-1",
  },
  {
    id: "n7",
    title: "Gift ideas",
    body: "Mom: gardening gloves, a good book, spa day.\nNoah: noise-cancelling headphones.\nIvy: art supplies set.\nLeo: soccer cleats.",
    category: "Personal",
    tags: ["shopping"],
    updated: "3 days ago",
    color: "bg-chart-4",
  },
]
