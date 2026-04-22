import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai'
import OpenAI from 'openai'

export async function processLogiSenseInput(rawText: string, summary: string) {
  // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Using the pro model for reasoning and structure compliance
  const response = await openAI.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a DHL logistic analyst. You must return a JSON object with the following structure:
        {
          "category": "A Single Word Category (e.g., Errors, Maintenance, Training, Customers)",
          "documentType": "Strictly either 'article' or 'sop'",
          "title": "Ap professional title",
          "content": "Formatted HTML content for a TipTap editor (using h1, p, ul, li, strong)"
        }`,
      },
      {
        role: 'user',
        content: `Please transform this logistics data:
        Summary: ${summary}
        Raw Text: ${rawText}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2, // keep output deterministic
  })

  const content = response.choices[0].message.content || '{}'
  return JSON.parse(content)
}
