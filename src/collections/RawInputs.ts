import type { CollectionConfig } from 'payload'

export const RawInputs: CollectionConfig = {
  slug: 'raw-inputs',
  admin: {
    useAsTitle: 'sourceType',
    description: 'Raw OCR data and initial LLM summaries fetched via UiPath.',
  },
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [
    { name: 'rawText', type: 'textarea', required: true },
    { name: 'summary', type: 'textarea' },
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
      admin: { position: 'sidebar' },
    },
  ],
}
