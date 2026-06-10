export type SelfMessage = {
  id: string
  text: string
  time: string
  date: string
  pinned?: boolean
  replyToId?: string
}

export const initialSelfMessages: SelfMessage[] = [
  {
    id: "m1",
    text: "Idea: build a shared family recipe book inside Second Brain.",
    time: "09:12",
    date: "Yesterday",
  },
  {
    id: "m2",
    text: "Wifi password for the cabin: bluemountain2024",
    time: "09:13",
    date: "Yesterday",
    pinned: true,
  },
  {
    id: "m3",
    text: "Remember to renew Leo's passport before August.",
    time: "14:40",
    date: "Yesterday",
  },
  {
    id: "m4",
    text: "Grocery list: oat milk, eggs, spinach, coffee, bananas.",
    time: "08:02",
    date: "Today",
  },
  {
    id: "m5",
    text: "Dentist appointment moved to Thursday 3pm.",
    time: "08:05",
    date: "Today",
    replyToId: "m4",
  },
  {
    id: "m6",
    text: "Book idea: \"The Quiet Garden\" — start outline this weekend.",
    time: "11:21",
    date: "Today",
  },
  {
    id: "m7",
    text: "Gift ideas for Mom: gardening gloves, a good book, spa day.",
    time: "16:48",
    date: "Today",
    pinned: true,
  },
]
