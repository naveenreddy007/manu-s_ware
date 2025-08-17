"use client"

import { useState, useEffect } from "react"
import { InspirationFeed } from "@/components/inspiration/inspiration-feed"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, TrendingUp, Users, Bookmark, User } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { MyPostsManager } from "@/components/inspiration/my-posts-manager"

export default function InspirationPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("feed")
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-black text-primary">Style Inspiration</h1>
              <p className="text-sm text-muted-foreground">Discover and share amazing outfit ideas</p>
            </div>

            {user && (
              <Link href="/inspiration/create">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Share Your Style
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${user ? "grid-cols-5" : "grid-cols-4"} mb-8`}>
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Following
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved
            </TabsTrigger>
            {user && (
              <TabsTrigger value="my-posts" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                My Posts
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <InspirationFeed />
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Trending Outfits</h3>
              <p className="text-muted-foreground">Coming soon - discover the most popular outfit inspirations</p>
            </div>
          </TabsContent>

          <TabsContent value="following" className="space-y-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Following</h3>
              <p className="text-muted-foreground">Follow other users to see their latest outfit inspirations here</p>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Saved Outfits</h3>
              <p className="text-muted-foreground">Your saved outfit inspirations will appear here</p>
            </div>
          </TabsContent>

          {user && (
            <TabsContent value="my-posts" className="space-y-6">
              <MyPostsManager />
            </TabsContent>
          )}
        </Tabs>

        {!user && (
          <div className="mt-12 text-center p-8 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Join the MANUS Community</h3>
            <p className="text-muted-foreground mb-4">
              Sign up to share your outfit inspirations, save favorites, and earn from your style influence
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/auth/sign-up">
                <Button>Sign Up</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline">Log In</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
