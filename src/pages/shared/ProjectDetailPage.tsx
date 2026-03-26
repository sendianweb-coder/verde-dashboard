import { ArrowLeft } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { Button } from '@/components/ui/button'
import { useProject } from '@/hooks/useProjects'
import { getErrorMessage } from '@/lib/errors'
import type { ProjectProductSummary } from '@/types/project'

interface ProjectDetailPageProps {
  backPath: string
}

export function ProjectDetailPage({ backPath }: ProjectDetailPageProps) {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const projectQuery = useProject(id)

  const productColumns = useMemo<Array<ColumnDef<ProjectProductSummary>>>(
    () => [
      {
        accessorKey: 'productName',
        header: 'Product',
        cell: ({ row }) => <span className="font-medium text-text-primary">{row.original.productName}</span>,
      },
      { accessorKey: 'sku', header: 'SKU' },
      { accessorKey: 'requestedQuantity', header: 'Requested' },
      { accessorKey: 'currentStockQuantity', header: 'Stock' },
      { accessorKey: 'currentReservedQuantity', header: 'Reserved' },
      { accessorKey: 'currentAvailableQuantity', header: 'Available' },
    ],
    [],
  )

  if (projectQuery.isLoading) {
    return <PageSkeleton />
  }

  if (projectQuery.isError) {
    return <EmptyState title="Unable to load project" description={getErrorMessage(projectQuery.error, { context: 'load' })} />
  }

  const projectData = projectQuery.data
  if (!projectData) {
    return <EmptyState title="Project not found" description="The selected project could not be loaded." />
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Project Detail"
        subtitle={projectData.project.name}
        action={
          <Button type="button" variant="secondary" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Status</p>
          <p className="mt-2 text-xl font-semibold text-text-primary">{projectData.project.isActive ? 'Active' : 'Inactive'}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Total requests</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{projectData.stockDetails.totalRequestCount}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Unique products</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{projectData.stockDetails.totalUniqueProducts}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Requested quantity</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{projectData.stockDetails.totalRequestedQuantity}</p>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="text-lg font-semibold text-text-primary">Project information</h2>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <dt className="text-sm text-text-secondary">Name</dt>
            <dd className="text-sm font-medium text-text-primary">{projectData.project.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Created</dt>
            <dd className="text-sm font-medium text-text-primary">{new Date(projectData.project.createdAt).toLocaleString()}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm text-text-secondary">Description</dt>
            <dd className="text-sm text-text-primary">{projectData.project.description ?? 'No description provided.'}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Product stock summary</h2>
        <DataTable
          data={projectData.stockDetails.products}
          columns={productColumns}
          emptyTitle="No product usage found"
          emptyDescription="Products linked to this project's requests will appear here."
        />
      </section>
    </section>
  )
}
