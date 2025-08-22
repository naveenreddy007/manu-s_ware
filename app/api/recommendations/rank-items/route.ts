import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { primaryItem, candidateItems } = await request.json()

    if (!primaryItem || !candidateItems || !Array.isArray(candidateItems)) {
      return NextResponse.json({ error: "Missing primaryItem or candidateItems array" }, { status: 400 })
    }

    // Create detailed prompt for Gemini to act as fashion stylist
    const prompt = `You are an expert fashion stylist. I need you to rank clothing items based on how well they complement a primary wardrobe item.

PRIMARY ITEM:
- Name: ${primaryItem.name}
- Category: ${primaryItem.category}
- Color: ${primaryItem.color}
- Style: ${primaryItem.style || "Not specified"}
- Pattern: ${primaryItem.pattern || "Not specified"}
- Material: ${primaryItem.material || "Not specified"}
- Occasion: ${primaryItem.occasion || "Not specified"}
- Season: ${primaryItem.season || "Not specified"}
- Fit: ${primaryItem.fit || "Not specified"}
- Neckline: ${primaryItem.neckline || "Not specified"}
- Sleeve Length: ${primaryItem.sleeve_length || "Not specified"}
- Formality Score: ${primaryItem.formality_score || "Not specified"}

CANDIDATE ITEMS TO RANK:
${candidateItems
  .map(
    (item, index) => `
${index + 1}. ID: ${item.id}
   - Name: ${item.name}
   - Category: ${item.category}
   - Color: ${item.color}
   - Style: ${item.style || "Not specified"}
   - Pattern: ${item.pattern || "Not specified"}
   - Material: ${item.material || "Not specified"}
   - Occasion: ${item.occasion || "Not specified"}
   - Season: ${item.season || "Not specified"}
   - Fit: ${item.fit || "Not specified"}
   - Neckline: ${item.neckline || "Not specified"}
   - Sleeve Length: ${item.sleeve_length || "Not specified"}
   - Formality Score: ${item.formality_score || "Not specified"}
   - Price: ₹${item.price}
`,
  )
  .join("")}

As a professional stylist, rank these candidate items from BEST to WORST based on:
1. Color harmony and complementary colors
2. Style compatibility and aesthetic cohesion
3. Occasion appropriateness
4. Seasonal compatibility
5. Formality level matching
6. Pattern mixing principles
7. Overall outfit balance and visual appeal

You MUST respond with ONLY a clean JSON object in this exact format:
{
  "ranked_ids": [array of item IDs in best-to-worst order]
}

Do not include any explanations, reasoning, or additional text. Only return the JSON object.`

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    let cleanedText = text.trim()

    // Remove markdown code block wrapper if present
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "")
    }

    // Parse the JSON response
    let rankedData
    try {
      rankedData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", cleanedText)
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 })
    }

    if (!rankedData.ranked_ids || !Array.isArray(rankedData.ranked_ids)) {
      return NextResponse.json({ error: "Invalid ranking format from AI" }, { status: 500 })
    }

    return NextResponse.json({ ranked_ids: rankedData.ranked_ids })
  } catch (error) {
    console.error("AI ranking error:", error)
    return NextResponse.json({ error: "Failed to rank items" }, { status: 500 })
  }
}
