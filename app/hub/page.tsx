"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  BookOpen, 
  Search, 
  X, 
  Bookmark, 
  Play, 
  Headphones, 
  FileText, 
  Image as ImageIcon,
  Book,
  Clock,
  User
} from "lucide-react"
import PageHeader from "@/components/page-header"
import { 
  MOCK_POSTS, 
  CATEGORIES, 
  POST_TYPES, 
  PostType, 
  Category, 
  HubPost 
} from "@/lib/hub"

const STORAGE_BOOKMARKS_KEY = "pmp-hub-bookmarks"

const ICON_MAP: Record<string, any> = {
  FileText,
  Play,
  Headphones,
  Book,
  ImageIcon
}

function HubPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<PostType | "all">("all")
  const [filterCat, setFilterCat] = useState<Category | "all">("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])

  // Load tag query parameter if set
  useEffect(() => {
    const qParam = searchParams.get("q")
    if (qParam) {
      setSearchQuery(`#${qParam}`)
    }
  }, [searchParams])

  // Load bookmarks
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BOOKMARKS_KEY)
      if (saved) {
        setBookmarkedIds(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const next = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter(bId => bId !== id)
      : [...bookmarkedIds, id]
    setBookmarkedIds(next)
    localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(next))
  }

  // Filter logic
  const filteredPosts = useMemo(() => {
    let list = [...MOCK_POSTS]
    
    if (filterType !== "all") {
      list = list.filter(p => p.type === filterType)
    }
    if (filterCat !== "all") {
      list = list.filter(p => p.category === filterCat)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace("#", "")
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    list.sort((a, b) => {
      const timeA = new Date(a.date).getTime()
      const timeB = new Date(b.date).getTime()
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB
    })

    return list
  }, [searchQuery, filterType, filterCat, sortOrder])

  const featuredPosts = useMemo(() => {
    return MOCK_POSTS.filter(p => p.featured)
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSearchQuery(`#${tag}`)
    setFilterType("all")
    setFilterCat("all")
  }

  return (
    <div className="flex flex-col px-4 pb-24">
      <PageHeader title="Content Hub" subtitle="Research, market guides and podcasts" />

      {/* Search Bar */}
      <div className="flex gap-2 items-center rounded-xl border border-border/40 bg-card/60 px-3.5 py-2.5 mb-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles, #tags, authors..."
          className="w-full bg-transparent text-xs font-semibold outline-none placeholder:text-muted-foreground/60"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Post Type Filters */}
      <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none mb-3">
        <button
          onClick={() => setFilterType("all")}
          className={`rounded-lg border px-3 py-1 text-xs font-semibold whitespace-nowrap active:scale-95 ${
            filterType === "all"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/30 bg-card/60 text-muted-foreground"
          }`}
        >
          All Feed
        </button>
        {POST_TYPES.map((t) => {
          const TypeIcon = ICON_MAP[t.icon] || FileText
          return (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key)}
              className={`rounded-lg border px-3 py-1 text-xs font-semibold whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
                filterType === t.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/30 bg-card/60 text-muted-foreground"
              }`}
            >
              <TypeIcon className="h-3 w-3 shrink-0" style={{ color: filterType === t.key ? "var(--primary)" : t.color }} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* FEATURED CAROUSEL (Show only when search/filters are empty) */}
      {!searchQuery && filterType === "all" && filterCat === "all" && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2.5">Featured Content</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {featuredPosts.map((post) => {
              const pType = POST_TYPES.find(t => t.key === post.type)!
              const TypeIcon = ICON_MAP[pType.icon] || FileText
              return (
                <div
                  key={post.id}
                  onClick={() => router.push(`/hub/${post.id}`)}
                  className="w-[280px] shrink-0 snap-start rounded-xl border border-border/40 bg-gradient-to-br from-card to-card/70 p-4 cursor-pointer flex flex-col justify-between h-44 hover:border-primary/45 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <span 
                      className="rounded-full px-2.5 py-0.5 text-[8px] font-black tracking-wider uppercase inline-flex items-center gap-1"
                      style={{ backgroundColor: pType.color + '20', color: pType.color }}
                    >
                      <TypeIcon className="h-2.5 w-2.5" />
                      {pType.label}
                    </span>
                    <button onClick={(e) => toggleBookmark(post.id, e)} className="text-muted-foreground/60 hover:text-primary">
                      <Bookmark className="h-3.5 w-3.5" fill={bookmarkedIds.includes(post.id) ? "var(--primary)" : "none"} />
                    </button>
                  </div>
                  
                  <div className="mt-2.5">
                    <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-tight">{post.title}</h3>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1">{post.excerpt}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/20 flex justify-between items-center text-[9px] font-bold text-muted-foreground">
                    <span className="truncate max-w-[120px]">{post.author}</span>
                    <span>{formatDate(post.date)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Category topic selector */}
      <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none mb-3 border-y border-border/20 py-2">
        <button
          onClick={() => setFilterCat("all")}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap active:scale-95 ${
            filterCat === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Topics
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilterCat(c.key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap active:scale-95 ${
              filterCat === c.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Sort order + count info */}
      <div className="flex justify-between items-center mb-3 px-1 text-[10px] font-bold text-muted-foreground">
        <span>{filteredPosts.length} posts available</span>
        <button 
          onClick={() => setSortOrder(o => o === "newest" ? "oldest" : "newest")}
          className="text-primary hover:underline"
        >
          Sort: {sortOrder === "newest" ? "Newest First" : "Oldest First"}
        </button>
      </div>

      {/* Posts list grid */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border/30 rounded-2xl">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No matching entries found.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const pType = POST_TYPES.find(t => t.key === post.type)!
            const catLabel = CATEGORIES.find(c => c.key === post.category)!.label
            const TypeIcon = ICON_MAP[pType.icon] || FileText

            return (
              <div
                key={post.id}
                onClick={() => router.push(`/hub/${post.id}`)}
                className="rounded-xl border border-border/40 bg-card p-4.5 cursor-pointer hover:border-primary/45 hover:bg-card/95 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 items-center">
                    <span 
                      className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1"
                      style={{ backgroundColor: pType.color + '15', color: pType.color }}
                    >
                      <TypeIcon className="h-2.5 w-2.5" />
                      {pType.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground/70 font-semibold">{catLabel}</span>
                  </div>
                  
                  <div className="flex gap-3 items-center">
                    <span className="text-[10px] text-muted-foreground/50">{formatDate(post.date)}</span>
                    <button onClick={(e) => toggleBookmark(post.id, e)} className="text-muted-foreground/60 hover:text-primary">
                      <Bookmark className="h-3.5 w-3.5" fill={bookmarkedIds.includes(post.id) ? "var(--primary)" : "none"} />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-foreground leading-snug mt-2.5">{post.title}</h3>
                <p className="text-xs text-muted-foreground/80 mt-1 leading-normal line-clamp-2">{post.excerpt}</p>

                <div className="mt-3.5 pt-2 border-t border-border/20 flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 opacity-60" />
                    <span>{post.author}</span>
                  </div>
                  
                  {(post.readTime || post.duration) && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-60" />
                      <span>{post.readTime || post.duration}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.tags.map(t => (
                    <span 
                      key={t} 
                      onClick={(e) => handleTagClick(t, e)}
                      className="text-[9px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 px-2 py-0.5 rounded-md"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function HubPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[80vh] flex-col items-center justify-center text-xs text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
        Loading Content Hub...
      </div>
    }>
      <HubPageContent />
    </Suspense>
  )
}
