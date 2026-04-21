import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: Request) {
  try {
    // 1. Parse the incoming JSON from the UiPath HTTP Request
    const body = await req.json()
    const { rawText, summary, sourceType } = body

    // Basic validation
    if (!rawText || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: rawText or sourceType' },
        { status: 400 },
      )
    }

    // 2. Initialize the Payload Local API
    const payload = await getPayload({ config: configPromise })

    // 3. Create the RawInput record in the database
    const newRawInput = await payload.create({
      collection: 'raw-inputs',
      data: {
        rawText: rawText,
        summary: summary || 'No summary provided by RPA.',
        sourceType: sourceType, // Should match 'screenshot', 'email', etc.
        // category will be assigned later by the AI background process
      },
    })

    // 4. Return a fast 200 OK so the UiPath robot can terminate and save compute time
    // In a real system, you would trigger the LLM processing here asynchronously
    return NextResponse.json(
      {
        success: true,
        message: 'Data ingested successfully into LogiSense',
        docId: newRawInput.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('LogiSense Ingestion Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
