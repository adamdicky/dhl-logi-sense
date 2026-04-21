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
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
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
