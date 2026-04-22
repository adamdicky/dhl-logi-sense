import type { CollectionConfig } from 'payload'
import { processLogiSenseInput } from '../services/aiTransformation'

export const RawInputs: CollectionConfig = {
  slug: 'raw-inputs',
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' && doc.rawText) {
          try {
            console.log(`[LogiSense] Starting AI processing for ${doc.id}`)

            // CRITICAL FIX: We MUST 'await' the AI call so Vercel does not freeze the container
            const aiResult = await processLogiSenseInput(doc.rawText, doc.summary)
            console.log(
              `[LogiSense] AI Transformation complete. Document Type: ${aiResult.documentType}`,
            )

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
                data: {
                  title: aiResult.category,
                  slug: aiResult.category.toLowerCase().replace(/\s+/g, '-'),
                },
              })
              categoryId = newCategory.id
            }

            // 2. Update the original RawInput with its new Category
            await req.payload.update({
              collection: 'raw-inputs',
              id: doc.id,
              data: { category: categoryId },
            })

            // 3. Save to either Articles or SOPs
            const targetCollection = aiResult.documentType === 'sop' ? 'sops' : 'articles'

            await req.payload.create({
              collection: targetCollection,
              data: {
                title: aiResult.title,
                content: aiResult.content,
                basedOn: doc.id,
              },
            })

            console.log(`[LogiSense] Successfully generated and saved to ${targetCollection}`)
          } catch (error) {
            console.error('[LogiSense] CRITICAL ERROR IN AI PIPELINE:', error)
          }
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
