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
