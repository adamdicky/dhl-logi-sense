import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Activity, AlertCircle, HardDrive } from 'lucide-react'
import { DashboardTableClient } from './DashboardTableClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const payload = await getPayload({ config: configPromise })

  // Fetch metrics and table data in parallel
  const [rawInputs, sops, articles, categories] = await Promise.all([
    payload.find({ collection: 'raw-inputs', limit: 10, sort: '-createdAt' }),
    payload.find({ collection: 'sops', limit: 20, sort: '-createdAt' }),
    payload.find({ collection: 'articles', limit: 20, sort: '-createdAt' }),
    payload.find({ collection: 'categories', limit: 10 }),
  ])

  // Normalize and merge SOPs and Articles for the unified table
  const unifiedDocuments = [
    ...sops.docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      createdAt: doc.createdAt,
      type: 'sops' as const,
    })),
    ...articles.docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      createdAt: doc.createdAt,
      type: 'articles' as const,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort newest first

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">LogiSense Overview</h1>
          <p className="text-muted-foreground mt-1">DHL Operations Knowledge Base & AI Ingestion</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">View Analytics</Button>
          <Button>Process New Manual Input</Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Processing</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rawInputs.totalDocs}</div>
            <p className="text-xs text-muted-foreground">Raw inputs from UiPath</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sops.totalDocs + articles.totalDocs}</div>
            <p className="text-xs text-muted-foreground">SOPs & Articles combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Categories</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.totalDocs}</div>
            <p className="text-xs text-muted-foreground">Detected SWCs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Online</div>
            <p className="text-xs text-muted-foreground">UiPath Webhook Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Unified Table */}
      <DashboardTableClient documents={unifiedDocuments} />
    </div>
  )
}
