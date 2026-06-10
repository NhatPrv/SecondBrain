import {
  Folder,
  FileText,
  ImageIcon,
  FileSpreadsheet,
  FileType,
  Video,
  Music,
  File,
  type LucideIcon,
} from "lucide-react"
import type { DriveItem } from "@/lib/files-data"

export const kindMeta: Record<
  DriveItem["kind"],
  { icon: LucideIcon; tint: string; bg: string; label: string }
> = {
  folder: { icon: Folder, tint: "text-chart-1", bg: "bg-chart-1/10", label: "Folder" },
  image: { icon: ImageIcon, tint: "text-chart-3", bg: "bg-chart-3/10", label: "Image" },
  pdf: { icon: FileType, tint: "text-chart-5", bg: "bg-chart-5/10", label: "PDF" },
  doc: { icon: FileText, tint: "text-chart-1", bg: "bg-chart-1/10", label: "Document" },
  sheet: { icon: FileSpreadsheet, tint: "text-chart-3", bg: "bg-chart-3/10", label: "Spreadsheet" },
  video: { icon: Video, tint: "text-chart-4", bg: "bg-chart-4/10", label: "Video" },
  audio: { icon: Music, tint: "text-chart-2", bg: "bg-chart-2/10", label: "Audio" },
  file: { icon: File, tint: "text-muted-foreground", bg: "bg-muted", label: "File" },
}
