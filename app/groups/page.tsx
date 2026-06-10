import { AppShell } from "@/components/app-shell"
import { Messenger } from "@/components/messenger/messenger"
import { groupConversations } from "@/lib/messenger-data"

export default function GroupsPage() {
  return (
    <AppShell title="Group Chat" noScroll>
      <Messenger conversations={groupConversations} heading="Group Chat" />
    </AppShell>
  )
}
