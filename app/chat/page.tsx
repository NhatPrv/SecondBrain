import { AppShell } from "@/components/app-shell"
import { Messenger } from "@/components/messenger/messenger"
import { conversations } from "@/lib/messenger-data"

export default function ChatPage() {
  return (
    <AppShell title="All Chat" noScroll>
      <Messenger conversations={conversations} heading="All Chat" />
    </AppShell>
  )
}
