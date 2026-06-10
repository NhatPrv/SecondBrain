"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Upload,
  Search,
  Grid2x2,
  List,
  MoreVertical,
  Pencil,
  FolderInput,
  Trash2,
  Star,
  Download,
  Home,
  Plus,
  FileUp,
  Loader2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { type DriveItem } from "@/lib/files-data"
import { kindMeta } from "@/components/files/file-icon"
import { api, getToken } from "@/lib/api"

interface UploadProgress {
  id: string
  fileName: string
  progress: number
  status: "uploading" | "success" | "error"
  errorMsg?: string
}

export function FileManager() {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [items, setItems] = useState<DriveItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [dragOver, setDragOver] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<DriveItem | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [moving, setMoving] = useState<DriveItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [storage, setStorage] = useState<{ usedBytes: number; limitBytes: number; percentage: number }>({
    usedBytes: 0,
    limitBytes: 107374182400,
    percentage: 0,
  })
  const [previewingFile, setPreviewingFile] = useState<DriveItem | null>(null)
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getDownloadUrlWithToken = (itemId: string) => {
    const token = getToken()
    return `${api.files.downloadUrl(itemId)}?token=${token || ""}`
  }

  useEffect(() => {
    if (!previewingFile) {
      setPreviewText(null)
      return
    }

    const isText = previewingFile.name.endsWith(".txt") ||
                   previewingFile.name.endsWith(".md") ||
                   previewingFile.name.endsWith(".json") ||
                   previewingFile.name.endsWith(".js") ||
                   previewingFile.name.endsWith(".ts") ||
                   previewingFile.name.endsWith(".css") ||
                   previewingFile.name.endsWith(".html") ||
                   previewingFile.kind === "doc" && previewingFile.name.endsWith(".txt")

    if (isText) {
      setLoadingPreview(true)
      fetch(getDownloadUrlWithToken(previewingFile.id))
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load text content")
          return res.text()
        })
        .then((text) => setPreviewText(text))
        .catch((err) => {
          console.error(err)
          setPreviewText("Không thể tải nội dung file văn bản này.")
        })
        .finally(() => setLoadingPreview(false))
    }
  }, [previewingFile])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 KB"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    // We prefer MB/GB for display, fallback to KB if small
    if (i === 0) return "1 KB"
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Auto-expand current folder and its parents
  useEffect(() => {
    if (currentFolder) {
      const toExpand = { ...expandedFolders }
      let updated = false
      if (!toExpand[currentFolder]) {
        toExpand[currentFolder] = true
        updated = true
      }
      let parentId = items.find((i) => i.id === currentFolder)?.parentId
      while (parentId) {
        if (!toExpand[parentId]) {
          toExpand[parentId] = true
          updated = true
        }
        parentId = items.find((i) => i.id === parentId)?.parentId
      }
      if (updated) {
        setExpandedFolders(toExpand)
      }
    }
  }, [currentFolder, items])

  const folders = items.filter((i) => i.kind === "folder")

  // Load all items (files and folders) from backend
  const loadItems = async () => {
    try {
      const data = await api.files.list("all")
      setItems(data)
    } catch (err) {
      console.error("Failed to load drive items:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadStorage = async () => {
    try {
      const data = await api.files.storage()
      setStorage(data)
    } catch (err) {
      console.error("Failed to load storage statistics:", err)
    }
  }

  useEffect(() => {
    loadItems()
    loadStorage()
  }, [])

  const breadcrumbs = useMemo(() => {
    const chain: DriveItem[] = []
    let id = currentFolder
    while (id) {
      const f = items.find((i) => i.id === id)
      if (!f) break
      chain.unshift(f)
      id = f.parentId
    }
    return chain
  }, [currentFolder, items])

  const visible = useMemo(() => {
    let list = items.filter((i) => i.parentId === currentFolder)
    if (query.trim()) {
      list = items.filter((i) =>
        i.name.toLowerCase().includes(query.toLowerCase()),
      )
    }
    // folders first
    return [...list].sort((a, b) => {
      if (a.kind === "folder" && b.kind !== "folder") return -1
      if (a.kind !== "folder" && b.kind === "folder") return 1
      return a.name.localeCompare(b.name)
    })
  }, [items, currentFolder, query])

  async function addUploads(files: FileList | File[]) {
    const arr = Array.from(files)
    if (arr.length === 0) return
    
    // Create upload progress items
    const newUploads = arr.map((f) => {
      const uploadId = Math.random().toString(36).substring(2, 9)
      return {
        id: uploadId,
        fileName: f.name,
        progress: 0,
        status: "uploading" as const,
        file: f,
      }
    })

    setUploads((prev) => [...prev, ...newUploads.map(({ file, ...rest }) => rest)])

    // Run parallel uploads - reload items after EACH successful upload
    const promises = newUploads.map(async ({ id, fileName, file }) => {
      try {
        await api.files.upload(file, currentFolder, (pct) => {
          setUploads((prev) =>
            prev.map((up) => (up.id === id ? { ...up, progress: pct } : up))
          )
        })
        
        // Update status to success
        setUploads((prev) =>
          prev.map((up) =>
            up.id === id ? { ...up, status: "success" as const, progress: 100 } : up
          )
        )

        // Reload file list and storage immediately after each successful upload
        await loadItems()
        await loadStorage()

        // Auto remove successful uploads from panel after 4 seconds
        setTimeout(() => {
          setUploads((prev) => prev.filter((up) => up.id !== id))
        }, 4000)
      } catch (err: any) {
        console.error(`Failed to upload ${fileName}:`, err)
        setUploads((prev) =>
          prev.map((up) =>
            up.id === id
              ? { ...up, status: "error" as const, errorMsg: err.message || "Upload failed" }
              : up
          )
        )
      }
    })

    await Promise.all(promises)
  }

  async function deleteItem(id: string) {
    try {
      await api.files.delete(id)
      await loadItems()
      await loadStorage()
    } catch (err) {
      console.error("Failed to delete item:", err)
    }
  }

  async function toggleStar(id: string) {
    try {
      await api.files.star(id)
      await loadItems()
    } catch (err) {
      console.error("Failed to star item:", err)
    }
  }

  async function commitRename() {
    if (!renaming || !renameValue.trim()) return
    try {
      await api.files.rename(renaming.id, renameValue.trim())
      setRenaming(null)
      await loadItems()
    } catch (err) {
      console.error("Failed to rename item:", err)
    }
  }

  async function moveItem(itemId: string, targetFolderId: string | null) {
    if (itemId === targetFolderId) return
    try {
      await api.files.move(itemId, targetFolderId)
      await loadItems()
    } catch (err) {
      console.error("Failed to move item:", err)
    }
  }

  async function newFolder() {
    try {
      await api.files.createFolder("Untitled folder", currentFolder)
      await loadItems()
    } catch (err) {
      console.error("Failed to create folder:", err)
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Folder tree */}
      <div className="hidden w-64 shrink-0 flex-col border-r border-border lg:flex">
        <div className="p-3">
          <Button className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
            Upload
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2">
          <button
            onClick={() => setCurrentFolder(null)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              currentFolder === null
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            <Home className="size-4" />
            My Drive
          </button>
          <FolderTree
            folders={folders}
            parentId={null}
            currentFolder={currentFolder}
            onSelect={setCurrentFolder}
            depth={0}
            onDropItem={moveItem}
            draggingId={draggingId}
            expandedFolders={expandedFolders}
            onToggle={toggleFolder}
          />
        </ScrollArea>
        <div className="border-t border-border p-4 bg-muted/20">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Storage Space</span>
            <span>{storage.percentage.toFixed(1)}% used</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                storage.percentage > 90
                  ? "bg-destructive"
                  : storage.percentage > 75
                  ? "bg-warning"
                  : "bg-primary"
              )}
              style={{ width: `${Math.min(100, storage.percentage)}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground font-light leading-none">
            {formatBytes(storage.usedBytes)} of {formatBytes(storage.limitBytes)} used
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-1 text-sm">
            <button
              onClick={() => setCurrentFolder(null)}
              className="rounded px-1.5 py-0.5 font-medium hover:bg-accent"
            >
              My Drive
            </button>
            {breadcrumbs.map((b) => (
              <span key={b.id} className="flex items-center gap-1">
                <ChevronRight className="size-4 text-muted-foreground" />
                <button
                  onClick={() => setCurrentFolder(b.id)}
                  className="truncate rounded px-1.5 py-0.5 font-medium hover:bg-accent"
                >
                  {b.name}
                </button>
              </span>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files..."
              className="h-9 bg-muted/60 pl-9"
            />
          </div>

          <Button variant="outline" size="sm" className="gap-1.5" onClick={newFolder}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">New folder</span>
          </Button>

          <div className="flex items-center rounded-md border border-border p-0.5">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              aria-label="Grid view"
              onClick={() => setView("grid")}
            >
              <Grid2x2 className="size-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              aria-label="List view"
              onClick={() => setView("list")}
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>

        {/* Drop zone / content */}
        <div
          className="relative flex-1 overflow-y-auto p-4"
          onDragOver={(e) => {
            e.preventDefault()
            if (!draggingId) setDragOver(true)
          }}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) setDragOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files.length) addUploads(e.dataTransfer.files)
          }}
        >
          {dragOver && (
            <div className="pointer-events-none absolute inset-3 z-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary/5">
              <FileUp className="size-8 text-primary" />
              <p className="text-sm font-medium text-primary">
                Drop files to upload
              </p>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {query ? "No files match your search" : "This folder is empty"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag files here or use the upload button
                </p>
              </div>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visible.map((item) => (
                <GridCard
                  key={item.id}
                  item={item}
                  onOpen={() => {
                    if (item.kind === "folder") {
                      setCurrentFolder(item.id)
                    } else {
                      setPreviewingFile(item)
                    }
                  }}
                  onRename={() => {
                    setRenaming(item)
                    setRenameValue(item.name)
                  }}
                  onMove={() => setMoving(item)}
                  onDelete={() => deleteItem(item.id)}
                  onStar={() => toggleStar(item.id)}
                  onDragStart={() => setDraggingId(item.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDropOnFolder={() => {
                    if (item.kind === "folder" && draggingId)
                      moveItem(draggingId, item.id)
                  }}
                  isDragging={draggingId === item.id}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                <span>Name</span>
                <span className="hidden sm:block">Type</span>
                <span className="hidden w-20 sm:block">Size</span>
                <span className="w-8" />
              </div>
              {visible.map((item) => (
                <ListRow
                  key={item.id}
                  item={item}
                  onOpen={() => {
                    if (item.kind === "folder") {
                      setCurrentFolder(item.id)
                    } else {
                      setPreviewingFile(item)
                    }
                  }}
                  onRename={() => {
                    setRenaming(item)
                    setRenameValue(item.name)
                  }}
                  onMove={() => setMoving(item)}
                  onDelete={() => deleteItem(item.id)}
                  onStar={() => toggleStar(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addUploads(e.target.files)
          e.target.value = ""
        }}
      />

      {/* Rename dialog */}
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitRename()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={commitRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={!!previewingFile} onOpenChange={(o) => !o && setPreviewingFile(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-6 bg-card text-card-foreground border border-border rounded-xl">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-3 shrink-0">
            <DialogTitle className="truncate text-base font-semibold max-w-[80%] pr-4">
              {previewingFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-[300px] flex items-center justify-center bg-muted/30 rounded-lg p-2 mt-4">
            {previewingFile && (
              <>
                {previewingFile.kind === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getDownloadUrlWithToken(previewingFile.id)}
                    alt={previewingFile.name}
                    className="max-w-full max-h-[60vh] object-contain rounded-md shadow-sm"
                  />
                )}

                {previewingFile.kind === "video" && (
                  <video
                    src={getDownloadUrlWithToken(previewingFile.id)}
                    controls
                    autoPlay
                    className="max-w-full max-h-[60vh] rounded-md shadow-sm"
                  />
                )}

                {previewingFile.kind === "audio" && (
                  <audio
                    src={getDownloadUrlWithToken(previewingFile.id)}
                    controls
                    autoPlay
                    className="w-full max-w-lg"
                  />
                )}

                {previewingFile.kind === "pdf" && (
                  <iframe
                    src={getDownloadUrlWithToken(previewingFile.id)}
                    className="w-full h-[60vh] rounded-md border-0"
                    title={previewingFile.name}
                  />
                )}

                {/* Text file fallback */}
                {(previewingFile.name.endsWith(".txt") ||
                  previewingFile.name.endsWith(".md") ||
                  previewingFile.name.endsWith(".json") ||
                  previewingFile.name.endsWith(".js") ||
                  previewingFile.name.endsWith(".ts") ||
                  previewingFile.name.endsWith(".css") ||
                  previewingFile.name.endsWith(".html") ||
                  (previewingFile.kind === "doc" && previewingFile.name.endsWith(".txt"))) ? (
                    loadingPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Loading file content...</span>
                      </div>
                    ) : (
                      <pre className="w-full max-h-[60vh] overflow-auto whitespace-pre-wrap font-mono text-xs p-4 bg-muted/80 rounded-md border border-border text-foreground">
                        {previewText}
                      </pre>
                    )
                ) : (
                  // General unsupported formats (e.g. Word, Excel, generic files)
                  !(["image", "video", "audio", "pdf"].includes(previewingFile.kind)) && (
                    <div className="text-center p-6 flex flex-col items-center gap-3">
                      <FolderOpen className="size-12 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Không hỗ trợ xem trước định dạng này</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Bạn có thể tải file về máy để xem trực tiếp.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => window.open(getDownloadUrlWithToken(previewingFile.id), "_blank")}
                        className="mt-2 gap-2"
                      >
                        <Download className="size-4" />
                        Tải file về
                      </Button>
                    </div>
                  )
                )}
              </>
            )}
          </div>
          <DialogFooter className="border-t border-border pt-3 mt-4 shrink-0 flex items-center justify-between sm:justify-between w-full">
            <span className="text-xs text-muted-foreground font-light">
              Kích thước: {previewingFile?.size || "Unknown"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => window.open(getDownloadUrlWithToken(previewingFile!.id), "_blank")}
              >
                <Download className="size-4" />
                Tải về
              </Button>
              <Button size="sm" onClick={() => setPreviewingFile(null)}>
                Đóng
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move dialog */}
      <Dialog open={!!moving} onOpenChange={(o) => !o && setMoving(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move &ldquo;{moving?.name}&rdquo;</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                if (moving) moveItem(moving.id, null)
                setMoving(null)
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent text-left w-full"
            >
              <Home className="size-4 text-muted-foreground" />
              My Drive
            </button>
            {folders
              .filter((f) => f.id !== moving?.id)
              .map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    if (moving) moveItem(moving.id, f.id)
                    setMoving(null)
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent text-left w-full"
                >
                  <Folder className="size-4 text-chart-1" />
                  {f.name}
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Upload Progress Panel */}
      {uploads.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-3 rounded-xl border border-border bg-popover p-4 shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-sm font-semibold text-foreground">
              Uploading files ({uploads.filter((u) => u.status === "uploading").length} active)
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setUploads([])}
              aria-label="Close"
            >
              <X className="size-3.5" />
            </Button>
          </div>
          
          <ScrollArea className="max-h-60 overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
              {uploads.map((up) => (
                <div key={up.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-foreground max-w-[70%]" title={up.fileName}>
                      {up.fileName}
                    </span>
                    <span className="shrink-0 font-semibold text-muted-foreground">
                      {up.status === "uploading" && `${up.progress}%`}
                      {up.status === "success" && <span className="text-chart-3 font-medium">Success</span>}
                      {up.status === "error" && <span className="text-destructive font-medium">Failed</span>}
                    </span>
                  </div>
                  
                  {/* Progress bar or error message */}
                  {up.status === "error" ? (
                    <span className="text-[10px] text-destructive truncate" title={up.errorMsg}>
                      {up.errorMsg}
                    </span>
                  ) : (
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-200",
                          up.status === "success" ? "bg-chart-3" : "bg-primary"
                        )}
                        style={{ width: `${up.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

function FolderTree({
  folders,
  parentId,
  currentFolder,
  onSelect,
  depth,
  onDropItem,
  draggingId,
  expandedFolders,
  onToggle,
}: {
  folders: DriveItem[]
  parentId: string | null
  currentFolder: string | null
  onSelect: (id: string) => void
  depth: number
  onDropItem: (itemId: string, target: string) => void
  draggingId: string | null
  expandedFolders: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  const children = folders.filter((f) => f.parentId === parentId)
  if (children.length === 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      {children.map((f) => {
        const isExpanded = !!expandedFolders[f.id]
        const hasChildren = folders.some((child) => child.parentId === f.id)
        const isActive = currentFolder === f.id

        return (
          <div key={f.id} className="flex flex-col">
            <div
              onDragOver={(e) => draggingId && e.preventDefault()}
              onDrop={() => draggingId && onDropItem(draggingId, f.id)}
              style={{ paddingLeft: `${depth * 16}px` }}
              className={cn(
                "group flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-sm transition-colors text-left",
                isActive
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/40",
              )}
            >
              {/* Chevron toggle button */}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(f.id)
                  }}
                  className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-muted-foreground/10 text-muted-foreground/75"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </button>
              ) : (
                <div className="size-5 shrink-0" />
              )}

              {/* Folder button (icon & name) */}
              <button
                type="button"
                onClick={() => {
                  onSelect(f.id)
                  if (!isExpanded) {
                    onToggle(f.id)
                  }
                }}
                className="flex flex-1 items-center gap-2 truncate py-1 text-left"
              >
                {isActive || isExpanded ? (
                  <FolderOpen className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-chart-1")} />
                ) : (
                  <Folder className="size-4 shrink-0 text-chart-1" />
                )}
                <span className="truncate">{f.name}</span>
              </button>
            </div>

            {/* Subfolders tree */}
            {isExpanded && (
              <FolderTree
                folders={folders}
                parentId={f.id}
                currentFolder={currentFolder}
                onSelect={onSelect}
                depth={depth + 1}
                onDropItem={onDropItem}
                draggingId={draggingId}
                expandedFolders={expandedFolders}
                onToggle={onToggle}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ItemMenu({
  item,
  isFolder,
  starred,
  onRename,
  onMove,
  onDelete,
  onStar,
}: {
  item: DriveItem
  isFolder: boolean
  starred?: boolean
  onRename: () => void
  onMove: () => void
  onDelete: () => void
  onStar: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="More options"
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onStar}>
          <Star className={cn("size-4", starred && "fill-chart-4 text-chart-4")} />
          {starred ? "Remove star" : "Add star"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="size-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMove}>
          <FolderInput className="size-4" />
          Move to
        </DropdownMenuItem>
        {!isFolder && (
          <DropdownMenuItem onClick={() => window.open(api.files.downloadUrl(item.id), "_blank")}>
            <Download className="size-4" />
            Download
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function GridCard({
  item,
  onOpen,
  onRename,
  onMove,
  onDelete,
  onStar,
  onDragStart,
  onDragEnd,
  onDropOnFolder,
  isDragging,
}: {
  item: DriveItem
  onOpen: () => void
  onRename: () => void
  onMove: () => void
  onDelete: () => void
  onStar: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDropOnFolder: () => void
  isDragging: boolean
}) {
  const meta = kindMeta[item.kind] || kindMeta["file"]
  const Icon = meta.icon
  const isFolder = item.kind === "folder"
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => isFolder && e.preventDefault()}
      onDrop={() => isFolder && onDropOnFolder()}
      onDoubleClick={onOpen}
      className={cn(
        "group relative flex cursor-pointer flex-col rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm",
        isDragging && "opacity-40",
      )}
    >
      <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <ItemMenu
          item={item}
          isFolder={isFolder}
          starred={item.starred}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          onStar={onStar}
        />
      </div>
      {item.starred && (
        <Star className="absolute left-2 top-2 size-3.5 fill-chart-4 text-chart-4" />
      )}
      <div
        className={cn(
          "mb-3 flex aspect-[4/3] items-center justify-center rounded-lg",
          meta.bg,
        )}
      >
        <Icon className={cn("size-9", meta.tint)} />
      </div>
      <p className="truncate text-sm font-medium">{item.name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground font-light">
        {item.size ? `${item.size} · ` : ""}
        {item.modified}
      </p>
    </div>
  )
}

function ListRow({
  item,
  onOpen,
  onRename,
  onMove,
  onDelete,
  onStar,
}: {
  item: DriveItem
  onOpen: () => void
  onRename: () => void
  onMove: () => void
  onDelete: () => void
  onStar: () => void
}) {
  const meta = kindMeta[item.kind] || kindMeta["file"]
  const Icon = meta.icon
  const isFolder = item.kind === "folder"
  return (
    <div
      onDoubleClick={onOpen}
      className="grid cursor-pointer grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-border px-4 py-2.5 text-sm transition-colors last:border-0 hover:bg-accent/40"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            meta.bg,
          )}
        >
          <Icon className={cn("size-4", meta.tint)} />
        </span>
        <span className="flex items-center gap-1.5 truncate font-medium">
          {item.name}
          {item.starred && (
            <Star className="size-3 shrink-0 fill-chart-4 text-chart-4" />
          )}
        </span>
      </div>
      <span className="hidden text-xs text-muted-foreground sm:block">
        {meta.label}
      </span>
      <span className="hidden w-20 text-xs text-muted-foreground sm:block">
        {item.size ?? "—"}
      </span>
      <ItemMenu
        item={item}
        isFolder={isFolder}
        starred={item.starred}
        onRename={onRename}
        onMove={onMove}
        onDelete={onDelete}
        onStar={onStar}
      />
    </div>
  )
}
