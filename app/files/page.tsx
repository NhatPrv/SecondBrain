import { AppShell } from "@/components/app-shell"
import { FileManager } from "@/components/files/file-manager"

export default function FilesPage() {
  return (
    <AppShell title="Files" noScroll>
      <FileManager />
    </AppShell>
  )
}
