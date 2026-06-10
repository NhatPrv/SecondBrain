export type DriveItem = {
  id: string
  name: string
  kind: "folder" | "image" | "pdf" | "doc" | "sheet" | "video" | "audio" | "file"
  size?: string
  modified: string
  parentId: string | null
  starred?: boolean
}

export const initialItems: DriveItem[] = [
  // root folders
  { id: "f-photos", name: "Family Photos", kind: "folder", modified: "May 2", parentId: null, starred: true },
  { id: "f-docs", name: "Documents", kind: "folder", modified: "Apr 28", parentId: null },
  { id: "f-school", name: "School", kind: "folder", modified: "Apr 20", parentId: null },
  { id: "f-trips", name: "Trips", kind: "folder", modified: "Mar 15", parentId: null },
  // root files
  { id: "i-1", name: "House_insurance.pdf", kind: "pdf", size: "2.4 MB", modified: "May 1", parentId: null },
  { id: "i-2", name: "Budget_2026.sheet", kind: "sheet", size: "180 KB", modified: "Apr 30", parentId: null, starred: true },
  { id: "i-3", name: "Family_calendar.doc", kind: "doc", size: "92 KB", modified: "Apr 25", parentId: null },
  { id: "i-4", name: "Beach_sunset.jpg", kind: "image", size: "5.1 MB", modified: "Apr 22", parentId: null },
  { id: "i-5", name: "Birthday_song.mp3", kind: "audio", size: "3.2 MB", modified: "Apr 18", parentId: null },
  { id: "i-6", name: "Recital_clip.mp4", kind: "video", size: "48 MB", modified: "Apr 10", parentId: null },

  // inside Family Photos
  { id: "p-1", name: "Summer 2025", kind: "folder", modified: "May 2", parentId: "f-photos" },
  { id: "p-2", name: "Garden.jpg", kind: "image", size: "4.2 MB", modified: "May 1", parentId: "f-photos" },
  { id: "p-3", name: "Picnic.jpg", kind: "image", size: "3.8 MB", modified: "Apr 29", parentId: "f-photos" },

  // inside Documents
  { id: "d-1", name: "Passports.pdf", kind: "pdf", size: "1.1 MB", modified: "Apr 28", parentId: "f-docs", starred: true },
  { id: "d-2", name: "Tax_2025.pdf", kind: "pdf", size: "820 KB", modified: "Apr 15", parentId: "f-docs" },

  // inside School
  { id: "s-1", name: "Report_card.pdf", kind: "pdf", size: "440 KB", modified: "Apr 20", parentId: "f-school" },
]
