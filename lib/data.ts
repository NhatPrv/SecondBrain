export type Member = {
  id: string
  name: string
  initials: string
  color: string
  online: boolean
}

export const family: Member[] = [
  { id: "maya", name: "Maya Carter", initials: "MC", color: "bg-chart-1", online: true },
  { id: "noah", name: "Noah Carter", initials: "NC", color: "bg-chart-3", online: true },
  { id: "ivy", name: "Ivy Carter", initials: "IC", color: "bg-chart-4", online: false },
  { id: "leo", name: "Leo Carter", initials: "LC", color: "bg-chart-5", online: true },
  { id: "grandma", name: "Grandma Rose", initials: "GR", color: "bg-chart-2", online: false },
]
