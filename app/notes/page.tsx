"use client"

import { useEffect, useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  Pin,
  Trash2,
  Calendar,
  Tag,
  Loader2,
  FolderOpen,
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const categories = ["All Notes", "Personal", "Family", "Work", "Ideas", "Recipes"]
const colors = [
  { class: "bg-chart-1", label: "Red/Orange" },
  { class: "bg-chart-2", label: "Green" },
  { class: "bg-chart-3", label: "Yellow" },
  { class: "bg-chart-4", label: "Purple" },
  { class: "bg-chart-5", label: "Blue" },
]

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState("All Notes")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Edit / Add note state
  const [editingNote, setEditingNote] = useState<any | null>(null)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteBody, setNoteBody] = useState("")
  const [noteCategory, setNoteCategory] = useState("Personal")
  const [noteColor, setNoteColor] = useState("bg-chart-1")
  const [noteTags, setNoteTags] = useState("")
  const [notePinned, setNotePinned] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadNotes = async () => {
    try {
      const data = await api.notes.list(
        activeCategory === "All Notes" ? undefined : activeCategory
      )
      setNotes(data)
    } catch (err) {
      console.error("Failed to load notes:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [activeCategory])

  const filtered = useMemo(() => {
    if (!query.trim()) return notes
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.body.toLowerCase().includes(query.toLowerCase())
    )
  }, [notes, query])

  function openCreate() {
    setEditingNote({ id: "new" })
    setNoteTitle("")
    setNoteBody("")
    setNoteCategory(activeCategory === "All Notes" ? "Personal" : activeCategory)
    setNoteColor("bg-chart-1")
    setNoteTags("")
    setNotePinned(false)
  }

  function openEdit(note: any) {
    setEditingNote(note)
    setNoteTitle(note.title)
    setNoteBody(note.body)
    setNoteCategory(note.category)
    setNoteColor(note.color)
    setNoteTags(note.tags?.join(", ") || "")
    setNotePinned(note.pinned || false)
  }

  async function saveNote() {
    setSaving(true)
    const tagArray = noteTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const payload = {
      title: noteTitle.trim() || "Untitled Note",
      body: noteBody.trim(),
      category: noteCategory,
      color: noteColor,
      tags: tagArray,
      pinned: notePinned,
    }

    try {
      if (editingNote.id === "new") {
        await api.notes.create(payload)
      } else {
        await api.notes.update(editingNote.id, payload)
      }
      setEditingNote(null)
      await loadNotes()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function deleteNote(id: string) {
    if (!confirm("Are you sure you want to delete this note?")) return
    try {
      await api.notes.delete(id)
      setEditingNote(null)
      await loadNotes()
    } catch (err) {
      console.error(err)
    }
  }

  async function togglePin(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await api.notes.pin(id)
      await loadNotes()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AppShell title="Notes">
      <div className="flex h-full min-h-[calc(100vh-4rem)]">
        {/* Left Category Sidebar */}
        <div className="hidden w-56 shrink-0 flex-col border-r border-border p-3 md:flex bg-muted/10">
          <Button className="w-full gap-2 mb-4 shadow-sm" onClick={openCreate}>
            <Plus className="size-4" />
            New note
          </Button>

          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </p>
          <div className="flex flex-col gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors font-medium",
                  activeCategory === cat
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/40"
                )}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Area */}
        <div className="flex min-w-0 flex-1 flex-col p-4 md:p-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes..."
                className="h-10 bg-muted/30 pl-9"
              />
            </div>

            <Button className="md:hidden gap-1.5 shadow-sm" onClick={openCreate}>
              <Plus className="size-4" />
              Note
            </Button>
          </div>

          {/* Notes Grid */}
          {loading ? (
            <div className="flex flex-1 items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center py-20 gap-3">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">No notes found</p>
                <p className="text-xs text-muted-foreground">
                  Create a new note to start writing down your ideas.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((note) => (
                <Card
                  key={note.id}
                  onClick={() => openEdit(note)}
                  className={cn(
                    "group relative flex cursor-pointer flex-col justify-between rounded-xl border border-border p-4 transition-all hover:border-primary/40 hover:shadow-md h-52 hover:-translate-y-0.5"
                  )}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm line-clamp-1 flex-1 pr-4 text-foreground leading-tight">
                        {note.title}
                      </h4>
                      <button
                        onClick={(e) => togglePin(note.id, e)}
                        className={cn(
                          "absolute right-3.5 top-3.5 p-1 rounded-md text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:bg-muted/80 hover:text-foreground transition-all",
                          note.pinned && "opacity-100 text-primary hover:text-primary"
                        )}
                        title={note.pinned ? "Unpin note" : "Pin note"}
                      >
                        <Pin className="size-3.5" />
                      </button>
                    </div>

                    {/* Content */}
                    <p className="text-xs text-muted-foreground/90 font-light line-clamp-5 whitespace-pre-wrap leading-normal mb-3 pr-2">
                      {note.body}
                    </p>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5">
                    <div className="flex flex-wrap gap-1">
                      {note.tags?.slice(0, 2).map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="h-4.5 text-[9px] px-1.5 font-light"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Color dot + date */}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className={cn("size-2 rounded-full", note.color)} />
                      <span>{note.category}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <Dialog
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingNote?.id === "new" ? "New Note" : "Edit Note"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Title"
                className="bg-muted/20"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label htmlFor="body">Note</Label>
              <Textarea
                id="body"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Take a note..."
                className="min-h-32 bg-muted/20 resize-none font-light text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-muted/20 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {categories.filter((c) => c !== "All Notes").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  placeholder="travel, summer, todo"
                  className="bg-muted/20"
                />
              </div>
            </div>

            {/* Note Color & Pin */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label>Theme Color</Label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.class}
                      type="button"
                      onClick={() => setNoteColor(c.class)}
                      className={cn(
                        "size-6 rounded-full border border-border shadow-sm transition-transform hover:scale-110",
                        c.class,
                        noteColor === c.class && "ring-2 ring-primary ring-offset-2"
                      )}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2.5 mt-4">
                <input
                  id="pinned"
                  type="checkbox"
                  checked={notePinned}
                  onChange={(e) => setNotePinned(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
                <Label htmlFor="pinned" className="cursor-pointer font-medium flex items-center gap-1.5">
                  <Pin className="size-3.5 text-primary" /> Pin to top
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
            <div>
              {editingNote?.id !== "new" && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteNote(editingNote.id)}
                  title="Delete note"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingNote(null)}
              >
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={saveNote}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
