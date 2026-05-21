"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Bookmark, 
  Clock, 
  User,
  FileText, 
  Play, 
  Headphones, 
  Book, 
  Image as ImageIcon 
} from "lucide-react"
import { MOCK_POSTS, CATEGORIES, POST_TYPES, HubPost } from "@/lib/hub"

const STORAGE_BOOKMARKS_KEY = "pmp-hub-bookmarks"

const ICON_MAP: Record<string, any> = {
  FileText,
  Play,
  Headphones,
  Book,
  ImageIcon
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function HubDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)

  const [post, setPost] = useState<HubPost | null>(null)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])

  // Load post and bookmarks
  useEffect(() => {
    const found = MOCK_POSTS.find(p => p.id === id)
    if (found) {
      setPost(found)
    } else {
      alert("Article not found.")
      router.push("/hub")
    }

    try {
      const saved = localStorage.getItem(STORAGE_BOOKMARKS_KEY)
      if (saved) {
        setBookmarkedIds(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
  }, [id, router])

  const toggleBookmark = () => {
    if (!post) return
    const next = bookmarkedIds.includes(post.id)
      ? bookmarkedIds.filter(bId => bId !== post.id)
      : [...bookmarkedIds, post.id]
    setBookmarkedIds(next)
    localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(next))
  }

  if (!post) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-xs text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
        Loading research guide...
      </div>
    )
  }

  const pType = POST_TYPES.find(t => t.key === post.type)!
  const catLabel = CATEGORIES.find(c => c.key === post.category)!.label
  const isBookmarked = bookmarkedIds.includes(post.id)
  const TypeIcon = ICON_MAP[pType.icon] || FileText

  return (
    <div className="flex flex-col px-4 max-w-2xl mx-auto pb-16">
      {/* Header navbar */}
      <div className="flex items-center justify-between border-b border-border/20 pt-4 pb-3 mb-6">
        <button 
          onClick={() => router.push("/hub")}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Hub
        </button>
        
        <span 
          className="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5"
          style={{ backgroundColor: pType.color + '20', color: pType.color }}
        >
          <TypeIcon className="h-3 w-3" />
          {pType.label}
        </span>

        <button 
          onClick={toggleBookmark}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-accent active:scale-90 transition-transform"
        >
          <Bookmark className="h-4.5 w-4.5" fill={isBookmarked ? "var(--primary)" : "none"} />
        </button>
      </div>

      {/* Main Content */}
      <article className="space-y-5">
        <div className="space-y-3">
          <span className="text-xs font-black uppercase text-primary tracking-widest">{catLabel}</span>
          <h1 className="text-xl font-extrabold text-foreground leading-snug">{post.title}</h1>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground/75 border-y border-border/20 py-2.5 font-semibold">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 opacity-60" />
              <span>By {post.author}</span>
            </div>
            <span>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>

        {/* Media Player embeds if exists */}
        {post.mediaUrl && post.type === "video" && (
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-border/40">
            <iframe 
              src={post.mediaUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}

        {post.mediaUrl && post.type === "podcast" && (
          <div className="w-full h-24 rounded-xl overflow-hidden bg-[#282828] border border-border/40">
            <iframe 
              src={post.mediaUrl} 
              className="w-full h-full border-0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
            />
          </div>
        )}

        {/* Text content body */}
        <div className="text-sm text-foreground/90 leading-relaxed space-y-4 font-normal">
          <p className="font-semibold text-foreground text-xs leading-normal bg-card border border-border/20 p-4 rounded-xl">
            {post.excerpt}
          </p>
          
          <p className="whitespace-pre-line">{post.body}</p>
          
          <p>
            At Precious Metals Pro, our educational material aims to bridge the gap between financial analysis and physical stacker realities. Bullion markets present unique characteristics regarding premiums, storage, buy-sell spreads, and taxation policies.
          </p>
          <p>
            Always verify spot indices and deal margins prior to liquidating scrap lots or adding heavy bullion weights to your private vaults.
          </p>
        </div>

        {/* Tags footer */}
        <div className="flex flex-wrap gap-2 pt-5 border-t border-border/20">
          {post.tags.map(t => (
            <span 
              key={t}
              onClick={() => { router.push(`/hub?q=${encodeURIComponent(t)}`); }}
              className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg cursor-pointer hover:bg-primary/20 active:scale-95 transition-all"
            >
              #{t}
            </span>
          ))}
        </div>
      </article>
    </div>
  )
}
