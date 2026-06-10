"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  Search,
  Send,
  Pin,
  Reply,
  SmilePlus,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  X,
  ArrowLeft,
  Loader2,
  Plus,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { api, getCachedUser } from "@/lib/api"
import { getSocket } from "@/lib/socket"

import {
  type ChatMessage,
  type Conversation,
} from "@/lib/messenger-data"

const REACTIONS = ["👍", "❤️", "😂", "🎉", "🌮"]

export function Messenger({
  conversations: initialConversations,
  heading,
}: {
  conversations?: Conversation[]
  heading: string
}) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState("")
  const [query, setQuery] = useState("")
  const [showThreadMobile, setShowThreadMobile] = useState(false)
  const [loading, setLoading] = useState(true)

  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  const openCreateGroupModal = async () => {
    setShowCreateGroupDialog(true)
    try {
      const users = await api.users.list()
      setAllUsers(users)
    } catch (err) {
      console.error("Failed to load users for group creation:", err)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert("Vui lòng nhập tên nhóm!")
      return
    }
    try {
      const newGroup = await api.chat.createGroup(newGroupName.trim(), selectedUserIds)
      setNewGroupName("")
      setSelectedUserIds([])
      setShowCreateGroupDialog(false)
      
      setLoading(true)
      const data = await api.chat.conversations()
      const filteredData = heading.toLowerCase().includes("group") 
        ? data.filter(c => c.type === "group") 
        : data;
      setConversations(filteredData)
      setActiveId(newGroup.id)
    } catch (err) {
      console.error("Failed to create group:", err)
      alert("Không thể tạo nhóm. Vui lòng thử lại!")
    } finally {
      setLoading(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const searchParams = useSearchParams()
  const queryActiveId = searchParams?.get("activeId")

  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await api.chat.conversations()
        const filteredData = heading.toLowerCase().includes("group") 
          ? data.filter(c => c.type === "group") 
          : data;

        setConversations(filteredData)
        if (queryActiveId && filteredData.some(c => c.id === queryActiveId)) {
          setActiveId(queryActiveId)
        } else if (filteredData.length > 0) {
          setActiveId(filteredData[0].id)
        }
      } catch (err) {
        console.error("Failed to load conversations:", err)
      } finally {
        setLoading(false)
      }
    }
    loadConversations()
  }, [heading, queryActiveId])

  useEffect(() => {
    if (queryActiveId && conversations.some(c => c.id === queryActiveId)) {
      setActiveId(queryActiveId)
    }
  }, [queryActiveId, conversations])

  useEffect(() => {
    const socket = getSocket()
    if (!socket.connected) socket.connect()

    const handleConversationUpdate = (data: { conversationId: string; lastMessage: any }) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === data.conversationId)
        if (idx === -1) return prev
        const updated = [...prev]
        const c = updated[idx]
        
        c.last = c.type === "group" 
          ? `${data.lastMessage.authorName.split(" ")[0]}: ${data.lastMessage.text}` 
          : data.lastMessage.text
        c.time = data.lastMessage.time

        const item = updated.splice(idx, 1)[0]
        const firstNonPinned = updated.findIndex((x) => !x.pinned)
        if (firstNonPinned === -1) {
          updated.push(item)
        } else {
          updated.splice(firstNonPinned, 0, item)
        }
        return updated
      })
    }

    const handleUserStatus = (data: { userId: string; online: boolean }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.type === "direct" && c.id === data.userId) {
            return { ...c, online: data.online }
          }
          return c
        })
      )
    }

    socket.on("conversation_update", handleConversationUpdate)
    socket.on("user_status", handleUserStatus)

    return () => {
      socket.off("conversation_update", handleConversationUpdate)
      socket.off("user_status", handleUserStatus)
    }
  }, [])

  const active = conversations.find((c) => c.id === activeId)

  const filtered = useMemo(
    () =>
      conversations.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [conversations, query],
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div
        className={cn(
          "flex w-full flex-col border-r border-border md:w-80 md:shrink-0",
          showThreadMobile && "hidden md:flex",
        )}
      >
        <div className="border-b border-border p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-sm font-semibold">{heading}</p>
            {(heading.toLowerCase().includes("group") || heading.toLowerCase().includes("all") || heading.toLowerCase().includes("conversations")) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-primary hover:bg-primary/10"
                onClick={openCreateGroupModal}
              >
                <Plus className="size-3.5" />
                <span>Create Group</span>
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="h-9 bg-muted/60 pl-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveId(c.id)
                  setShowThreadMobile(true)
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors",
                  c.id === activeId
                    ? "bg-accent"
                    : "hover:bg-accent/50",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="size-11">
                    <AvatarFallback className={cn("text-sm text-white", c.color)}>
                      {c.initials}
                    </AvatarFallback>
                  </Avatar>
                  {c.type === "direct" && c.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-chart-3" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 truncate text-sm font-medium">
                      {c.pinned && <Pin className="size-3 text-muted-foreground" />}
                      {c.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {c.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-xs",
                        c.last === "Typing..."
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {c.type === "group" && c.members
                        ? `${c.members} members · `
                        : ""}
                      {c.last}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Thread */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          !showThreadMobile && "hidden md:flex",
        )}
      >
        {active ? (
          <Thread
            conversation={active}
            onBack={() => setShowThreadMobile(false)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>

      {/* Dialog for creating group */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group Chat</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="group-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Group Name
              </label>
              <Input
                id="group-name"
                placeholder="Enter group name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Members
              </label>
              <ScrollArea className="h-[200px] rounded-md border border-input p-2 bg-muted/20">
                {allUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">Loading users...</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {allUsers
                      .filter((u) => u.id !== getCachedUser()?.id)
                      .map((u) => (
                        <div
                          key={u.id}
                          onClick={() => toggleUserSelection(u.id)}
                          className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => {}}
                            className="size-4 accent-primary rounded border-input"
                          />
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              <AvatarFallback className={cn("text-xs text-white", u.color)}>
                                {u.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-foreground">{u.name}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Thread({
  conversation,
  onBack,
}: {
  conversation: Conversation
  onBack: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMessageForReactors, setSelectedMessageForReactors] = useState<ChatMessage | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadMessages() {
      setLoading(true)
      try {
        const data = await api.chat.messages(conversation.id)
        setMessages(data)
        
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        })
      } catch (err) {
        console.error("Failed to load messages:", err)
      } finally {
        setLoading(false)
      }
    }
    loadMessages()
    setReplyTo(null)
    setDraft("")
    setTypingUser(null)
  }, [conversation.id])

  useEffect(() => {
    const socket = getSocket()
    socket.emit("join_conversation", { conversationId: conversation.id })

    const handleNewMessage = (data: { conversationId: string; message: any }) => {
      if (data.conversationId === conversation.id) {
        const currentUser = getCachedUser()
        const evaluatedMessage = {
          ...data.message,
          self: data.message.authorId === currentUser?.id
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === evaluatedMessage.id)) return prev
          
          if (evaluatedMessage.self) {
            const tempIdx = prev.findIndex((m) => m.status === "sending" && m.text === evaluatedMessage.text)
            if (tempIdx !== -1) {
              const updated = [...prev]
              updated[tempIdx] = {
                ...evaluatedMessage,
                status: "sent"
              }
              return updated
            }
          }
          return [...prev, evaluatedMessage]
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

    const handleReactionUpdate = (data: { messageId: string; reactions: any[]; reactors: any[] }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === data.messageId) {
            const updatedMessage = { ...m, reactions: data.reactions, reactors: data.reactors }
            setSelectedMessageForReactors((current) => {
              if (current && current.id === data.messageId) {
                return updatedMessage
              }
              return current
            })
            return updatedMessage
          }
          return m
        })
      )
    }

    const handlePinUpdate = (data: { messageId: string; pinned: boolean; text: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, pinned: data.pinned } : m))
      )
    }

    const handleUserTyping = (data: { conversationId: string; userId: string; name: string; isTyping: boolean }) => {
      if (data.conversationId === conversation.id) {
        if (data.isTyping) {
          setTypingUser(data.name.split(" ")[0])
        } else {
          setTypingUser(null)
        }
      }
    }

    socket.on("new_message", handleNewMessage)
    socket.on("reaction_update", handleReactionUpdate)
    socket.on("pin_update", handlePinUpdate)
    socket.on("user_typing", handleUserTyping)

    return () => {
      socket.emit("leave_conversation", { conversationId: conversation.id })
      socket.off("new_message", handleNewMessage)
      socket.off("reaction_update", handleReactionUpdate)
      socket.off("pin_update", handlePinUpdate)
      socket.off("user_typing", handleUserTyping)
    }
  }, [conversation.id])

  const pinned = messages.find((m) => m.pinned)

  function send() {
    if (!draft.trim()) return
    const socket = getSocket()
    
    // Create temporary optimistic message
    const tempId = `temp-${Date.now()}`
    const currentUser = getCachedUser()
    const tempMessage: ChatMessage = {
      id: tempId,
      authorId: currentUser?.id || "me",
      authorName: currentUser?.name || "Me",
      initials: currentUser?.initials || "ME",
      color: currentUser?.color || "bg-primary",
      text: draft.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      self: true,
      status: "sending"
    }

    // Add to local state immediately
    setMessages((prev) => [...prev, tempMessage])
    
    // Scroll to bottom immediately
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
    
    socket.emit("send_message", {
      conversationId: conversation.id,
      text: draft.trim(),
      replyToId: replyTo?.id,
    })

    socket.emit("typing", { conversationId: conversation.id, isTyping: false })
    
    setDraft("")
    setReplyTo(null)
  }

  function handleDraftChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value)
    const socket = getSocket()
    socket.emit("typing", {
      conversationId: conversation.id,
      isTyping: e.target.value.trim().length > 0,
    })
  }

  function toggleReaction(messageId: string, emoji: string) {
    const socket = getSocket()
    socket.emit("toggle_reaction", {
      messageId,
      emoji,
      conversationId: conversation.id,
    })
  }

  function togglePin(messageId: string) {
    const socket = getSocket()
    socket.emit("toggle_pin", {
      messageId,
      conversationId: conversation.id,
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 md:hidden"
          aria-label="Back"
          onClick={onBack}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <Avatar className="size-9">
          <AvatarFallback className={cn("text-sm text-white", conversation.color)}>
            {conversation.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{conversation.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {typingUser ? (
              <span className="text-primary font-medium">{typingUser} is typing...</span>
            ) : conversation.type === "group" ? (
              `${conversation.members} members`
            ) : conversation.online ? (
              "Online"
            ) : (
              "Offline"
            )}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-9" aria-label="Call">
          <Phone className="size-[18px]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="Video call"
        >
          <Video className="size-[18px]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="More options"
        >
          <MoreVertical className="size-[18px]" />
        </Button>
      </div>

      {/* Pinned banner */}
      {pinned && (
        <div className="flex items-center gap-2 border-b border-border bg-accent/40 px-4 py-2">
          <Pin className="size-3.5 shrink-0 text-primary" />
          <p className="truncate text-xs text-accent-foreground">
            <span className="font-medium">Pinned:</span> {pinned.text}
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
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.map((m, index) => {
            const isLastSelfMessage = m.self && index === messages.map(x => x.self).lastIndexOf(true);
            return (
              <Bubble
                key={m.id}
                message={m}
                isGroup={conversation.type === "group"}
                onReply={() => setReplyTo(m)}
                onReact={(emoji) => toggleReaction(m.id, emoji)}
                onPin={() => togglePin(m.id)}
                onShowReactors={(msg) => setSelectedMessageForReactors(msg)}
                isLastSelfMessage={isLastSelfMessage}
              />
            )
          })}
        </div>
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-3 border-t border-border bg-muted/40 px-4 py-2">
          <Reply className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
            <p className="text-xs font-medium text-primary">
              Reply to {replyTo.authorName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{replyTo.text}</p>
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
            aria-label="Attach"
          >
            <Paperclip className="size-5" />
          </Button>
          <Input
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={`Message ${conversation.name}...`}
            className="h-11 flex-1 rounded-full bg-muted/60"
          />
          <Button
            size="icon"
            className="size-10 shrink-0 rounded-full"
            aria-label="Send"
            onClick={send}
          >
            <Send className="size-[18px]" />
          </Button>
        </div>
      </div>

      {/* Reactor Details Dialog */}
      <Dialog open={!!selectedMessageForReactors} onOpenChange={(open) => !open && setSelectedMessageForReactors(null)}>
        <DialogContent className="sm:max-w-xs p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Message Reactions</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2.5 mt-2 max-h-60 overflow-y-auto">
            {selectedMessageForReactors?.reactors && selectedMessageForReactors.reactors.length > 0 ? (
              selectedMessageForReactors.reactors.map((reactor, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-1 rounded-md">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarFallback className={cn("text-xs text-white", reactor.color)}>
                        {reactor.initials || reactor.userName.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{reactor.userName}</span>
                  </div>
                  <span className="text-lg">{reactor.emoji}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-2 text-center">No reactions yet</p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button size="sm" variant="outline" className="w-full" onClick={() => setSelectedMessageForReactors(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Bubble({
  message,
  isGroup,
  onReply,
  onReact,
  onPin,
  onShowReactors,
  isLastSelfMessage,
}: {
  message: ChatMessage
  isGroup: boolean
  onReply: () => void
  onReact: (emoji: string) => void
  onPin: () => void
  onShowReactors: (message: ChatMessage) => void
  isLastSelfMessage: boolean
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const self = message.self
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [pickerOpen])

  // Get the emoji that current user has already reacted with (if any)
  const myReactedEmoji = message.reactions?.find((r) => r.reacted)?.emoji ?? null

  function handleReact(emoji: string) {
    // Toggle: clicking any emoji always calls onReact (server handles toggle logic)
    // If clicking same reacted emoji → toggle off
    // If clicking different emoji → switch to new one (server replaces old reaction)
    onReact(emoji)
    setPickerOpen(false)
  }

  return (
    <div className={cn("group flex gap-2", self ? "justify-end" : "justify-start")}>
      {!self && (
        <Avatar className="mt-auto size-7 shrink-0">
          <AvatarFallback className={cn("text-xs text-white", message.color)}>
            {message.initials}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex max-w-[78%] flex-col gap-1",
          self ? "items-end" : "items-start",
        )}
      >
        <div className="relative w-full" ref={pickerRef}>
          {/* hover actions */}
          <div
            className={cn(
              "absolute -top-3 z-10 flex items-center rounded-full border border-border bg-popover shadow-sm opacity-0 transition-opacity group-hover:opacity-100",
              self ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1",
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              aria-label="React"
              onClick={() => setPickerOpen((p) => !p)}
            >
              <SmilePlus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              aria-label="Reply"
              onClick={onReply}
            >
              <Reply className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              aria-label="Pin"
              onClick={onPin}
            >
              <Pin className={cn("size-3.5", message.pinned && "text-primary")} />
            </Button>
          </div>

          {/* emoji picker — shown BELOW the message bubble */}
          {pickerOpen && (
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 z-20 flex w-max items-center justify-center gap-1.5 rounded-full border border-border bg-popover px-3 py-2 shadow-md mt-1",
              )}
            >
              {REACTIONS.map((emoji) => {
                const isMyReaction = myReactedEmoji === emoji
                return (
                  <button
                    key={emoji}
                    className={cn(
                      "rounded-full px-1 text-lg transition-transform hover:scale-125 cursor-pointer",
                      isMyReaction && "bg-primary/20 ring-1 ring-primary scale-110",
                    )}
                    onClick={() => handleReact(emoji)}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          )}

          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm shadow-sm relative",
              self
                ? "rounded-br-md bg-primary text-primary-foreground"
                : "rounded-bl-md bg-card text-card-foreground",
            )}
          >
            {message.pinned && (
              <Pin className="absolute -left-1.5 -top-1.5 size-4 rounded-full bg-background p-0.5 text-primary shadow border" />
            )}
            
            {isGroup && !self && (
              <p
                className={cn(
                  "mb-0.5 text-xs font-semibold",
                  message.color.replace("bg-", "text-"),
                )}
              >
                {message.authorName}
              </p>
            )}
            {message.replyTo && (
              <div
                className={cn(
                  "mb-1.5 rounded-md border-l-2 px-2 py-1",
                  self
                    ? "border-primary-foreground/60 bg-primary-foreground/15"
                    : "border-primary bg-muted",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-medium",
                    self ? "text-primary-foreground/90" : "text-primary",
                  )}
                >
                  {message.replyTo.author}
                </p>
                <p
                  className={cn(
                    "line-clamp-1 text-xs",
                    self ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {message.replyTo.text}
                </p>
              </div>
            )}
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
            <span
              className={cn(
                "mt-0.5 block text-right text-[10px]",
                self ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {message.time}
            </span>

            {/* reactions overlay */}
            {message.reactions && message.reactions.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowReactors(message);
                }}
                className={cn(
                  "absolute -bottom-2.5 flex items-center gap-1 rounded-full border border-border bg-popover px-2 py-0.5 shadow-md text-xs cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-all duration-200 text-foreground",
                  self ? "right-3" : "left-3"
                )}
              >
                <div className="flex -space-x-1 items-center">
                  {message.reactions.map((r, i) => (
                    <span key={r.emoji} className="relative select-none" style={{ zIndex: 10 - i }}>
                      {r.emoji}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {message.reactions.reduce((sum, r) => sum + r.count, 0)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Status text & checkmark below message bubble */}
        {self && isLastSelfMessage && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground mr-1 select-none">
            <span>{message.status === "sending" ? "Đang gửi" : "Đã gửi"}</span>
            {message.status === "sending" ? (
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            ) : (
              <Check className="size-3 text-chart-3 animate-in zoom-in duration-100" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
