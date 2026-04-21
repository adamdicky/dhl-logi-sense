import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai'

// Define the exact probabilistic structure we expect back
const transformationSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      description:
        'A Single Word Category (SWC) relevant to DHL logistics (e.g., Errors, Maintenance, Training, Customs, Routing).',
    },
    documentType: {
      type: SchemaType.STRING,
      description:
        "Strictly either 'article' or 'sop' based on whether the input contains step-by-step instructions.",
    },
    title: {
      type: SchemaType.STRING,
      description: 'A clean, professional title for the document.',
    },
    content: {
      type: SchemaType.STRING,
      description:
        'The formatted content. Use HTML tags (<h1>, <p>, <ul>, <li>, <strong>) as this will be ingested by TipTap.',
    },
  },
  required: ['category', 'documentType', 'title', 'content'],
}

export async function processLogiSenseInput(rawText: string, summary: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

  // Using the pro model for reasoning and structure compliance
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: transformationSchema,
      temperature: 0.2, // Low temperature for highly deterministic outputs
    },
  })

  const prompt = `
    You are an expert logistics operations analyst for DHL.
    Transform the following unstructured data into a clean, professional knowledge base entry.
    
    Context Summary: ${summary}
    Raw Extracted Text: ${rawText}
  `

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    return JSON.parse(responseText)
  } catch (error) {
    console.error('Gemini Transformation Failed:', error)
    throw new Error('Failed to process AI transformation')
  }
}
