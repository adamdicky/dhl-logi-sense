import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    description: 'General knowledge base articles.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterDelete: [
      async ({ req, doc }) => {
        if (doc.basedOn) {
          try {
            const rawInputId = typeof doc.basedOn === 'object' ? doc.basedOn.id : doc.basedOn
            await req.payload.delete({
              collection: 'raw-inputs',
              id: rawInputId,
              req,
            })
            console.log(
              `[Cascade Delete] Removed raw-input ${rawInputId} linked to Article ${doc.id}`,
            )
          } catch (error) {
            console.error('[Cascade Delete] Error removing raw-input:', error)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea', // This will output JSON/HTML that your frontend TipTap editor will consume/edit
      required: true,
    },
    {
      name: 'basedOn',
      type: 'relationship',
      relationTo: 'raw-inputs',
      admin: {
        position: 'sidebar',
        description: 'The original raw input that generated this article.',
      },
    },
  ],
}
