export type Conversation = {
  id: string
  name: string
  type: "direct" | "group"
  initials: string
  color: string
  online?: boolean
  members?: number
  last: string
  time: string
  unread?: number
  pinned?: boolean
}

export type Reaction = { emoji: string; count: number; reacted?: boolean }

export type ChatMessage = {
  id: string
  authorId: string
  authorName: string
  initials: string
  color: string
  text: string
  time: string
  self?: boolean
  reactions?: Reaction[]
  reactors?: any[]
  status?: "sending" | "sent"
  replyTo?: { author: string; text: string }
  pinned?: boolean
}

export const conversations: Conversation[] = [
  {
    id: "family-all",
    name: "Carter Family",
    type: "group",
    initials: "CF",
    color: "bg-chart-1",
    members: 5,
    last: "Noah: Dinner at 7 works for me!",
    time: "16:52",
    unread: 3,
    pinned: true,
  },
  {
    id: "kids",
    name: "The Kids",
    type: "group",
    initials: "TK",
    color: "bg-chart-4",
    members: 3,
    last: "Ivy: can we get pizza 🍕",
    time: "15:30",
    unread: 1,
  },
  {
    id: "noah",
    name: "Noah Carter",
    type: "direct",
    initials: "NC",
    color: "bg-chart-3",
    online: true,
    last: "Sounds good, see you then.",
    time: "16:40",
  },
  {
    id: "ivy",
    name: "Ivy Carter",
    type: "direct",
    initials: "IC",
    color: "bg-chart-4",
    online: false,
    last: "You: did you finish homework?",
    time: "14:02",
  },
  {
    id: "leo",
    name: "Leo Carter",
    type: "direct",
    initials: "LC",
    color: "bg-chart-5",
    online: true,
    last: "Typing...",
    time: "13:11",
  },
  {
    id: "grandma",
    name: "Grandma Rose",
    type: "direct",
    initials: "GR",
    color: "bg-chart-2",
    online: false,
    last: "Love you all! ❤️",
    time: "Yesterday",
  },
]

export const groupConversations: Conversation[] = conversations.filter(
  (c) => c.type === "group",
)

export const messagesByConversation: Record<string, ChatMessage[]> = {
  "family-all": [
    {
      id: "f1",
      authorId: "maya",
      authorName: "Maya",
      initials: "MC",
      color: "bg-chart-1",
      text: "Hey everyone! Who's free for dinner tonight?",
      time: "16:30",
      pinned: true,
    },
    {
      id: "f2",
      authorId: "ivy",
      authorName: "Ivy",
      initials: "IC",
      color: "bg-chart-4",
      text: "Me! Can we have tacos?",
      time: "16:34",
      reactions: [{ emoji: "🌮", count: 2, reacted: true }],
    },
    {
      id: "f3",
      authorId: "leo",
      authorName: "Leo",
      initials: "LC",
      color: "bg-chart-5",
      text: "Tacos sound amazing",
      time: "16:36",
      replyTo: { author: "Ivy", text: "Me! Can we have tacos?" },
      reactions: [{ emoji: "👍", count: 3 }],
    },
    {
      id: "f4",
      authorId: "maya",
      authorName: "Maya",
      initials: "MC",
      color: "bg-chart-1",
      text: "Tacos it is. I'll pick up ingredients on the way home.",
      time: "16:40",
      self: true,
      reactions: [
        { emoji: "❤️", count: 2 },
        { emoji: "🎉", count: 1 },
      ],
    },
    {
      id: "f5",
      authorId: "noah",
      authorName: "Noah",
      initials: "NC",
      color: "bg-chart-3",
      text: "Dinner at 7 works for me!",
      time: "16:52",
    },
  ],
  kids: [
    {
      id: "k1",
      authorId: "leo",
      authorName: "Leo",
      initials: "LC",
      color: "bg-chart-5",
      text: "Movie night this weekend?",
      time: "15:10",
    },
    {
      id: "k2",
      authorId: "ivy",
      authorName: "Ivy",
      initials: "IC",
      color: "bg-chart-4",
      text: "can we get pizza 🍕",
      time: "15:30",
      reactions: [{ emoji: "🍕", count: 2, reacted: true }],
    },
  ],
  noah: [
    {
      id: "n1",
      authorId: "noah",
      authorName: "Noah",
      initials: "NC",
      color: "bg-chart-3",
      text: "Are we still on for the parent meeting?",
      time: "16:20",
    },
    {
      id: "n2",
      authorId: "maya",
      authorName: "Maya",
      initials: "MC",
      color: "bg-chart-1",
      text: "Yes! 6pm at the school.",
      time: "16:38",
      self: true,
    },
    {
      id: "n3",
      authorId: "noah",
      authorName: "Noah",
      initials: "NC",
      color: "bg-chart-3",
      text: "Sounds good, see you then.",
      time: "16:40",
    },
  ],
  ivy: [
    {
      id: "i1",
      authorId: "maya",
      authorName: "Maya",
      initials: "MC",
      color: "bg-chart-1",
      text: "did you finish homework?",
      time: "14:02",
      self: true,
    },
  ],
  leo: [
    {
      id: "l1",
      authorId: "leo",
      authorName: "Leo",
      initials: "LC",
      color: "bg-chart-5",
      text: "Mom can you pick me up at 5?",
      time: "13:11",
    },
  ],
  grandma: [
    {
      id: "g1",
      authorId: "grandma",
      authorName: "Grandma Rose",
      initials: "GR",
      color: "bg-chart-2",
      text: "Love you all! ❤️",
      time: "Yesterday",
    },
  ],
}
