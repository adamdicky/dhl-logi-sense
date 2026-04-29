'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { deleteDocuments } from './actions'

type DocumentData = {
  id: string | number
  title: string
  createdAt: string
  type: 'sops' | 'articles'
}

export function DashboardTableClient({ documents }: { documents: DocumentData[] }) {
  const [filter, setFilter] = useState<'all' | 'sops' | 'articles'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // NEW: State to track how many items to show
  const [visibleCount, setVisibleCount] = useState(10)

  // Reset pagination and selection when filter changes
  const handleFilterChange = (newFilter: 'all' | 'sops' | 'articles') => {
    setFilter(newFilter)
    setVisibleCount(10)
    setSelectedIds(new Set())
  }

  // Filter documents based on selection, then slice based on visibleCount
  const filteredDocs = documents.filter((doc) => filter === 'all' || doc.type === filter)
  const visibleDocs = filteredDocs.slice(0, visibleCount)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select the ones currently visible to prevent accidental mass deletion
      setSelectedIds(new Set(visibleDocs.map((doc) => doc.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string | number, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const handleDelete = async () => {
    if (selectedIds.size === 0) return
    setIsDeleting(true)

    const itemsToDelete = documents
      .filter((doc) => selectedIds.has(doc.id))
      .map((doc) => ({ id: doc.id, type: doc.type }))

    await deleteDocuments(itemsToDelete)
    setSelectedIds(new Set())
    setIsDeleting(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Generated Knowledge Base</CardTitle>
          <CardDescription>Review, edit, or remove AI-generated documents.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Controls */}
          <div className="flex bg-secondary p-1 rounded-md">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'ghost'}
              onClick={() => handleFilterChange('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === 'sops' ? 'default' : 'ghost'}
              onClick={() => handleFilterChange('sops')}
            >
              SOPs
            </Button>
            <Button
              size="sm"
              variant={filter === 'articles' ? 'default' : 'ghost'}
              onClick={() => handleFilterChange('articles')}
            >
              Articles
            </Button>
          </div>
          {/* Delete Action */}
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedIds.size === 0 || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.size === visibleDocs.length && visibleDocs.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[50px]">No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Document Title</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              visibleDocs.map((doc, index) => (
                <TableRow key={`${doc.type}-${doc.id}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(doc.id)}
                      onCheckedChange={(checked) => handleSelectOne(doc.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Badge
                      variant={doc.type === 'sops' ? 'default' : 'secondary'}
                      className="uppercase text-[10px]"
                    >
                      {doc.type === 'sops' ? 'SOP' : 'Article'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/${doc.type === 'sops' ? 'sop' : 'article'}/${doc.id}`}>
                      <Button variant="outline" size="sm">
                        Review & Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* NEW: Show More Button */}
        {filteredDocs.length > visibleCount && (
          <div className="flex justify-center mt-4">
            <Button variant="secondary" onClick={() => setVisibleCount((prev) => prev + 10)}>
              Show More...
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
