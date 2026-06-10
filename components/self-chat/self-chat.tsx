"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import {
  Search,
  Pin,
  PinOff,
  Reply,
  Send,
  X,
  Bookmark,
  Paperclip,
  Smile,
  CheckCheck,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { getSocket } from "@/lib/socket"

import { type ChatMessage as SelfMessage } from "@/lib/messenger-data"

export function SelfChat() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SelfMessage[]>([])
  const [draft, setDraft] = useState("")
  const [query, setQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [replyTo, setReplyTo] = useState<SelfMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Fetch conversations to find "Saved Messages" self-channel
  useEffect(() => {
    async function loadSelfChat() {
      try {
        const conversations = await api.chat.conversations()
        // Find Saved Messages
        const selfConv = conversations.find(
          (c) => c.name === "Saved Messages" || c.initials === "SM"
        )
        if (selfConv) {
          setConversationId(selfConv.id)
          const history = await api.chat.messages(selfConv.id)
          setMessages(history)
          
          // Auto scroll to bottom
          requestAnimationFrame(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
          })
        }
      } catch (err) {
        console.error("Failed to load self chat:", err)
      } finally {
        setLoading(false)
      }
    }
    loadSelfChat()
  }, [])

  // 2. Connect to Socket.IO for realtime self-chat syncing across devices/tabs
  useEffect(() => {
    if (!conversationId) return

    const socket = getSocket()
    socket.emit("join_conversation", { conversationId })

    const handleNewMessage = (data: { conversationId: string; message: any }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev
          return [...prev, data.message]
        })
        
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: "smooth",
            })
          }
        })
      }
    }

    const handlePinUpdate = (data: { messageId: string; pinned: boolean }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, pinned: data.pinned } : m))
      )
    }

    socket.on("new_message", handleNewMessage)
    socket.on("pin_update", handlePinUpdate)

    return () => {
      socket.emit("leave_conversation", { conversationId })
      socket.off("new_message", handleNewMessage)
      socket.off("pin_update", handlePinUpdate)
    }
  }, [conversationId])

  const pinned = messages.filter((m) => m.pinned)

  const filtered = useMemo(() => {
    if (!query.trim()) return messages
    return messages.filter((m) =>
      m.text.toLowerCase().includes(query.toLowerCase()),
    )
  }, [messages, query])

  // Group by date/day
  const grouped = useMemo(() => {
    const groups: { date: string; items: SelfMessage[] }[] = []
    
    // Group helper
    const getGroupDate = (msgTimeStr: string) => {
      // In messages, the backend returns human-friendly dates/times
      // Let's group messages that have "Yesterday", "Today" or specific dates
      if (msgTimeStr.includes(":")) {
        return "Today"
      }
      return msgTimeStr; // e.g. "Yesterday" or "Jun 6"
    }

    for (const m of filtered) {
      // Simple date group
      const dateGroup = getGroupDate(m.time)
      const last = groups[groups.length - 1]
      if (last && last.date === dateGroup) {
        last.items.push(m)
      } else {
        groups.push({ date: dateGroup, items: [m] })
      }
    }
    return groups
  }, [filtered])

  function send() {
    if (!draft.trim() || !conversationId) return
    const socket = getSocket()

    socket.emit("send_message", {
      conversationId,
      text: draft.trim(),
      replyToId: replyTo?.id,
    })

    setDraft("")
    setReplyTo(null)
  }

  function togglePin(messageId: string) {
    if (!conversationId) return
    const socket = getSocket()
    socket.emit("toggle_pin", {
      messageId,
      conversationId,
    })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bookmark className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Saved Messages</p>
            <p className="truncate text-xs text-muted-foreground">
              Your private space — only you can see this
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label="Search messages"
            onClick={() => setShowSearch((s) => !s)}
          >
            <Search className="size-[18px]" />
          </Button>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="border-b border-border bg-muted/30 px-4 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search in this chat..."
                className="h-9 bg-background pl-9"
              />
            </div>
          </div>
        )}

        {/* Pinned banner */}
        {pinned.length > 0 && !showSearch && (
          <div className="flex items-center gap-2 border-b border-border bg-accent/40 px-4 py-2">
            <Pin className="size-3.5 shrink-0 text-primary" />
            <p className="truncate text-xs text-accent-foreground">
              <span className="font-medium">{pinned.length} pinned</span>
              {" — "}
              {pinned[pinned.length - 1].text}
            </p>
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        >
          <div className="mx-auto flex max-w-2xl flex-col gap-1">
            {grouped.map((group) => (
              <div key={group.date} className="flex flex-col gap-1">
                <div className="sticky top-0 z-10 my-2 flex justify-center">
                  <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                    {group.date}
                  </span>
                </div>
                {group.items.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    replyTo={
                      m.replyTo
                        ? messages.find((x) => x.authorName === m.replyTo?.author && x.text === m.replyTo?.text)
                        : undefined
                    }
                    onPin={() => togglePin(m.id)}
                    onReply={() => setReplyTo(m)}
                  />
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No messages match &ldquo;{query}&rdquo;.
              </p>
            )}
          </div>
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div className="flex items-center gap-3 border-t border-border bg-muted/40 px-4 py-2">
            <Reply className="size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
              <p className="text-xs font-medium text-primary">Replying to note</p>
              <p className="truncate text-xs text-muted-foreground">
                {replyTo.text}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Cancel reply"
              onClick={() => setReplyTo(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border bg-background px-4 py-3">
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 text-muted-foreground"
              aria-label="Attach file"
            >
              <Paperclip className="size-5" />
            </Button>
            <div className="relative flex-1">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Write a note to yourself..."
                className="h-11 rounded-full bg-muted/60 pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground"
                aria-label="Emoji"
              >
                <Smile className="size-5" />
              </Button>
            </div>
            <Button
              size="icon"
              className="size-10 shrink-0 rounded-full"
              aria-label="Send message"
              onClick={send}
            >
              <Send className="size-[18px]" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

function MessageBubble({
  message,
  replyTo,
  onPin,
  onReply,
}: {
  message: SelfMessage
  replyTo?: SelfMessage
  onPin: () => void
  onReply: () => void
}) {
  return (
    <div className="group flex justify-end">
      <div className="flex max-w-[80%] items-end gap-1.5">
        {/* hover actions */}
        <div className="mb-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  aria-label="Reply"
                  onClick={onReply}
                />
              }
            >
              <Reply className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  aria-label={message.pinned ? "Unpin" : "Pin"}
                  onClick={onPin}
                />
              }
            >
              {message.pinned ? (
                <PinOff className="size-4" />
              ) : (
                <Pin className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent>{message.pinned ? "Unpin" : "Pin"}</TooltipContent>
          </Tooltip>
        </div>

        <div
          className={cn(
            "relative rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-primary-foreground shadow-sm",
          )}
        >
          {message.pinned && (
            <Pin className="absolute -left-1.5 -top-1.5 size-4 rounded-full bg-background p-0.5 text-primary shadow" />
          )}
          {replyTo && (
            <div className="mb-1.5 rounded-md border-l-2 border-primary-foreground/60 bg-primary-foreground/15 px-2 py-1">
              <p className="line-clamp-2 text-xs text-primary-foreground/90">
                {replyTo.text}
              </p>
            </div>
          )}
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.text}
          </p>
          <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-primary-foreground/70">
            {message.time.includes(":") ? message.time : "Saved"}
            <CheckCheck className="size-3" />
          </span>
        </div>
      </div>
    </div>
  )
}
