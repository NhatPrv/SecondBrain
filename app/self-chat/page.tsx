import { AppShell } from "@/components/app-shell"
import { SelfChat } from "@/components/self-chat/self-chat"

export default function SelfChatPage() {
  return (
    <AppShell title="Self Chat" noScroll>
      <SelfChat />
    </AppShell>
  )
}
