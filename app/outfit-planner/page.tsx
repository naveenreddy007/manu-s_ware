import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth-utils"
import { OutfitBuilder } from "@/components/outfit-planner/outfit-builder"

export default async function OutfitPlannerPage() {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Outfit Planner</h1>
        <p className="text-muted-foreground">Create and save complete outfits using your wardrobe and MANUS products</p>
      </div>

      <OutfitBuilder />
    </div>
  )
}
