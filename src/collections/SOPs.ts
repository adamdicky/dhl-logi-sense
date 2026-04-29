import type { CollectionConfig } from 'payload'

export const SOPs: CollectionConfig = {
  slug: 'sops',
  admin: {
    useAsTitle: 'title',
    description: 'Step-by-step Standard Operating Procedures.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterDelete: [
      async ({ req, doc }) => {
        // cascade delete the connected raw-input
        if (doc.basedOn) {
          try {
            const rawInputId = typeof doc.basedOn === 'object' ? doc.basedOn.id : doc.basedOn
            await req.payload.delete({
              collection: 'raw-inputs',
              id: rawInputId,
              req,
            })
            console.log(`[Cascade Delete] Removed raw-input ${rawInputId} linked to SOP ${doc.id}`)
          } catch (error) {
            console.log('[Cascade Delete] Error removing raw-input: ', error)
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
      type: 'textarea',
      required: true,
    },
    {
      name: 'basedOn',
      type: 'relationship',
      relationTo: 'raw-inputs',
      admin: {
        position: 'sidebar',
        description: 'The original raw input that generated this SOP.',
      },
    },
  ],
}
