import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  try {
    const { image } = await request.json()

    if (!image || typeof image !== "string" || image.trim() === "") {
      return NextResponse.json({ error: "Invalid or missing image data" }, { status: 400 })
    }

    if (!image.startsWith("data:image/") || image.length < 100) {
      return NextResponse.json({ error: "Invalid image format. Expected base64 data URL." }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const mimeTypeMatch = image.match(/^data:([^;]+);base64,/)
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg"
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "")

    const prompt = `You are a fashion expert analyzing clothing items. Analyze this image of a single clothing item and return ONLY a clean JSON object with this exact structure:

{
  "name": "A descriptive name for the item (e.g., 'Maroon Short-Sleeve Shirt')",
  "category": "One of: tops, bottoms, outerwear, shoes, or accessories",
  "color": "The single most dominant color (e.g., 'Maroon')",
  "style": "Fashion style (e.g., 'casual', 'formal', 'bohemian', 'minimalist', 'vintage')",
  "pattern": "Pattern type (e.g., 'solid', 'striped', 'floral', 'geometric', 'plaid')",
  "material": "Primary material (e.g., 'cotton', 'denim', 'silk', 'wool', 'polyester')",
  "occasion": "Best occasion (e.g., 'casual', 'work', 'formal', 'party', 'sports')",
  "season": "Best season (e.g., 'spring', 'summer', 'fall', 'winter', 'all-season')",
  "fit": "Fit type (e.g., 'slim', 'regular', 'loose', 'oversized', 'tailored')",
  "neckline": "Neckline type for tops (e.g., 'crew', 'v-neck', 'scoop', 'collar', 'none')",
  "sleeve_length": "Sleeve length for tops (e.g., 'short', 'long', 'sleeveless', '3/4', 'none')",
  "formality_score": 3
}

The formality_score should be a number from 1-5 where:
1 = Very casual (gym wear, loungewear)
2 = Casual (everyday wear, weekend)
3 = Smart casual (casual office, dinner out)
4 = Business formal (office meetings, interviews)
5 = Very formal (black tie, evening wear)

Return only the JSON object, no additional text or formatting.`

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    let analysis
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : text
      analysis = JSON.parse(jsonString)

      // Validate required fields
      if (!analysis.name || !analysis.category || !analysis.color) {
        throw new Error("Invalid response structure")
      }

      // Validate category is one of the allowed values
      const validCategories = ["tops", "bottoms", "outerwear", "shoes", "accessories"]
      if (!validCategories.includes(analysis.category)) {
        analysis.category = "tops" // Default fallback
      }

      // Ensure formality_score is a valid number between 1-5
      if (!analysis.formality_score || analysis.formality_score < 1 || analysis.formality_score > 5) {
        analysis.formality_score = 3 // Default to smart casual
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)
      console.error("Raw Gemini response:", text)

      // Fallback analysis if parsing fails
      analysis = {
        name: "Clothing Item",
        category: "tops",
        color: "unknown",
        style: "casual",
        pattern: "solid",
        material: "cotton",
        occasion: "casual",
        season: "all-season",
        fit: "regular",
        neckline: "crew",
        sleeve_length: "short",
        formality_score: 3,
      }
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Image analysis error:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
