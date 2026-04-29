'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function deleteDocuments(items: { id: number | string; type: 'sops' | 'articles' }[]) {
  const payload = await getPayload({ config: configPromise })

  for (const item of items) {
    try {
      await payload.delete({
        collection: item.type,
        id: item.id,
      })
    } catch (error) {
      console.error(`Failed to delete ${item.type} with ID ${item.id}:`, error)
    }
  }

  // Force the dashboard to refresh and show the updated list
  revalidatePath('/dashboard')
}
