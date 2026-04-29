import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { after } from 'next/server'
import { processLogiSenseInput } from '@/services/aiTransformation'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { rawText, summary, sourceType } = body

    if (!rawText || !sourceType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    // ==========================================
    // THE IDEMPOTENCY FIX (Anti-Triplication Shield)
    // ==========================================
    // 1. Check if we already received this exact data in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const duplicateCheck = await payload.find({
      collection: 'raw-inputs',
      where: {
        and: [{ rawText: { equals: rawText } }, { createdAt: { greater_than: fiveMinutesAgo } }],
      },
    })

    if (duplicateCheck.totalDocs > 0) {
      console.log('[LogiSense API] Network retry caught and blocked.')
      // Instantly satisfy the retrying robot without making new database entries
      return NextResponse.json(
        { success: true, message: 'Already processing', docId: duplicateCheck.docs[0].id },
        { status: 200 },
      )
    }
    // ==========================================

    // 2. FAST INSERT: Closes the DB transaction instantly
    const newRawInput = await payload.create({
      collection: 'raw-inputs',
      data: { rawText, summary: summary || 'No summary.', sourceType },
    })

    // 3. BACKGROUND AI: Vercel keeps this alive after the response is sent
    after(async () => {
      console.log(`[LogiSense Async] Starting AI for ${newRawInput.id}`)
      try {
        const aiResult = await processLogiSenseInput(rawText, summary)

        let categoryId
        const existingCategory = await payload.find({
          collection: 'categories',
          where: { title: { equals: aiResult.category } },
        })

        if (existingCategory.totalDocs > 0) {
          categoryId = existingCategory.docs[0].id
        } else {
          const newCategory = await payload.create({
            collection: 'categories',
            data: {
              title: aiResult.category,
              slug: aiResult.category.toLowerCase().replace(/\s+/g, '-'),
            },
          })
          categoryId = newCategory.id
        }

        await payload.update({
          collection: 'raw-inputs',
          id: newRawInput.id,
          data: { category: categoryId },
        })

        const targetCollection = aiResult.documentType === 'sop' ? 'sops' : 'articles'
        await payload.create({
          collection: targetCollection,
          data: {
            title: aiResult.title,
            content: aiResult.content,
            basedOn: newRawInput.id,
          },
        })
        console.log(`[LogiSense Async] Generated ${targetCollection} successfully.`)
      } catch (error) {
        console.error('[LogiSense Async] AI Pipeline Error:', error)
      }
    })

    // 4. INSTANT RESPONSE
    return NextResponse.json({ success: true, docId: newRawInput.id }, { status: 201 })
  } catch (error) {
    console.error('LogiSense Ingestion Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
