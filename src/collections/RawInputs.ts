import type { CollectionConfig } from 'payload'
import { processLogiSenseInput } from '../services/aiTransformation'

export const RawInputs: CollectionConfig = {
  slug: 'raw-inputs',
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        // Only run this on creation so we don't cause infinite loops on updates
        if (operation === 'create' && doc.rawText) {
          // Run the AI call asynchronously so it doesn't block the initial API response
          processLogiSenseInput(doc.rawText, doc.summary)
            .then(async (aiResult) => {
              console.log(`AI Transformation complete for ${doc.id}`)

              // 1. Check if the Category (SWC) exists, if not, create it
              let categoryId
              const existingCategory = await req.payload.find({
                collection: 'categories',
                where: { title: { equals: aiResult.category } },
              })

              if (existingCategory.totalDocs > 0) {
                categoryId = existingCategory.docs[0].id
              } else {
                const newCategory = await req.payload.create({
                  collection: 'categories',
                  data: { title: aiResult.category },
                })
                categoryId = newCategory.id
              }

              // 2. Update the original RawInput with its new Category
              await req.payload.update({
                collection: 'raw-inputs',
                id: doc.id,
                data: { category: categoryId },
              })

              // 3. Save to either Articles or SOPs based on Gemini's logical decision
              // Note: TipTap requires a specific JSON structure or HTML. We requested HTML from Gemini.
              // Payload's lexical/richText editor can ingest HTML, but you might need an HTML converter
              // depending on your exact TipTap setup. We will store it as a string for now if your schema uses richText,
              // or we might need to adjust the field type to 'text' temporarily or use Payload's HTML to Lexical parser.
              const targetCollection = aiResult.documentType === 'sop' ? 'sops' : 'articles'

              await req.payload.create({
                collection: targetCollection,
                data: {
                  title: aiResult.title,
                  content: aiResult.content, // Assuming your frontend will render this HTML safely
                  basedOn: doc.id,
                },
              })
            })
            .catch((err) => console.error('Background AI process failed:', err))
        }
      },
    ],
  },
  admin: {
    useAsTitle: 'sourceType',
    description: 'Raw OCR data and initial LLM summaries fetched via UiPath.',
  },
  access: {
    read: () => true,
    create: () => true, // Allows the API route/UiPath to create entries
  },
  fields: [
    {
      name: 'rawText',
      type: 'textarea',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'sourceType',
      type: 'select',
      options: [
        { label: 'MS Teams', value: 'teams' },
        { label: 'Email Thread', value: 'email' },
        { label: 'Screenshot', value: 'screenshot' },
        { label: 'Handwritten Note', value: 'handwritten' },
        { label: 'Training Material', value: 'training' },
      ],
      required: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
