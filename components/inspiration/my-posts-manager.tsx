"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Heart,
  Bookmark,
  Share2,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface InspirationPost {
  id: string
  title: string
  description: string
  image_url: string
  is_public: boolean
  likes_count: number
  saves_count: number
  shares_count: number
  total_purchases: number
  total_revenue: number
  total_commission: number
  created_at: string
  updated_at: string
}

export function MyPostsManager() {
  const [posts, setPosts] = useState<InspirationPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    fetchMyPosts()
  }, [])

  const fetchMyPosts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("outfit_inspiration_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (postId: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from("outfit_inspiration_posts")
        .update({ is_public: !currentVisibility })
        .eq("id", postId)

      if (error) throw error

      setPosts(posts.map((post) => (post.id === postId ? { ...post, is_public: !currentVisibility } : post)))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return
    }

    try {
      // Delete related data first
      await supabase.from("inspiration_product_tags").delete().eq("inspiration_id", postId)
      await supabase.from("inspiration_likes").delete().eq("inspiration_id", postId)
      await supabase.from("inspiration_saves").delete().eq("inspiration_id", postId)
      await supabase.from("outfit_inspiration_items").delete().eq("inspiration_id", postId)

      // Delete the main post
      const { error } = await supabase.from("outfit_inspiration_posts").delete().eq("id", postId)

      if (error) throw error

      setPosts(posts.filter((post) => post.id !== postId))
    } catch (error: any) {
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
        <p className="text-muted-foreground mb-4">
          You haven't shared any outfit inspirations yet. Start sharing your style!
        </p>
        <Link href="/inspiration/create">
          <Button>Create Your First Post</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Posts</h2>
          <p className="text-sm text-muted-foreground">Manage your outfit inspirations and track their performance</p>
        </div>
        <Link href="/inspiration/create">
          <Button>Create New Post</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-32 h-32 relative">
                  <img
                    src={post.image_url || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.description}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bookmark className="h-3 w-3" />
                          {post.saves_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          {post.shares_count}
                        </span>
                        {post.total_purchases > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <DollarSign className="h-3 w-3" />${post.total_commission.toFixed(2)} earned
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={post.is_public ? "default" : "secondary"}>
                          {post.is_public ? "Public" : "Private"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/inspiration/edit/${post.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleVisibility(post.id, post.is_public)}>
                          {post.is_public ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Make Private
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Make Public
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deletePost(post.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
