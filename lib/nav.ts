import type { LucideIcon } from "lucide-react"
import {
  Home,
  MessageCircle,
  Users,
  UsersRound,
  FolderClosed,
  StickyNote,
  Pin,
  Trash2,
  Settings,
  Sprout,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
}

export const mainNav: NavItem[] = [
  { title: "Home", href: "/", icon: Home },
  { title: "Self Chat", href: "/self-chat", icon: MessageCircle },
  { title: "All Chat", href: "/chat", icon: MessageCircle, badge: 3 },
  { title: "Group Chat", href: "/groups", icon: UsersRound },
  { title: "Files", href: "/files", icon: FolderClosed },
  { title: "Notes", href: "/notes", icon: StickyNote },
]

export const libraryNav: NavItem[] = [
  { title: "Pinned", href: "/pinned", icon: Pin },
  { title: "Trash", href: "/trash", icon: Trash2 },
  { title: "Settings", href: "/settings", icon: Settings },
]

export const worldNav: NavItem[] = [
  { title: "Pocket Farm", href: "/pocket-farm", icon: Sprout },
]

