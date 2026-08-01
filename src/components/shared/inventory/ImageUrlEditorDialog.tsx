import { useEffect, useState, type FormEvent } from 'react'

import { DialogFormActions } from '@/components/shared/DialogFormActions'
import { FormField } from '@/components/shared/FormField'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/errors'
import type { DraftInventoryImageTarget } from '@/types/inventoryWorkbook'

export type ImageUrlEditorTarget = {
  kind: 'persisted'
  sheetId: string
  rowIndex: number
  columnIndex: number
  rowToken: string
  imageUrl: string
}

export type InventoryImageEditorTarget = ImageUrlEditorTarget | DraftInventoryImageTarget

type ImageUrlEditorDialogProps = {
  target: InventoryImageEditorTarget | null
  onStage: (target: InventoryImageEditorTarget, image: File) => Promise<void>
  onClose: () => void
}

export function ImageUrlEditorDialog({ target, onStage, onClose }: ImageUrlEditorDialogProps) {
  const [image, setImage] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    setImage(null)
    setUploadError(null)
  }, [target])

  const handleOpenChange = (open: boolean) => {
    if (!open && !isUploading) {
      onClose()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!target || !image) {
      setUploadError('Select a JPEG, PNG, or WebP image to continue.')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    try {
      await onStage(target, image)
    } catch (error) {
      setImage(null)
      setUploadError(getErrorMessage(error, { context: 'update' }))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{target?.kind === 'draft' ? 'Upload product image' : 'Replace product image'}</DialogTitle>
          <DialogDescription>
            Select a primary image for inventory row {target ? target.rowIndex + 1 : ''}.{' '}
            {target?.kind === 'draft'
              ? 'It uploads to WordPress now and is saved to the new product when you save the workbook.'
              : 'It uploads only when you save the workbook.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            htmlFor="inventory-grid-image-upload"
            label="Image file"
            hint={target?.kind === 'draft'
              ? 'JPEG, PNG, or WebP up to 5 MB. Failed uploads require selecting the image again.'
              : 'JPEG, PNG, or WebP up to 5 MB. The image is staged locally until Save; the existing gallery and old Media Library file are retained.'}
          >
            <Input
              id="inventory-grid-image-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              disabled={isUploading}
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
          </FormField>

          {uploadError ? <p role="alert" className="text-sm text-red-600">{uploadError}</p> : null}
          <DialogFormActions
            isSubmitting={isUploading}
            submitLabel={target?.kind === 'draft' ? 'Upload image' : 'Stage image'}
            submittingLabel={target?.kind === 'draft' ? 'Uploading...' : 'Staging...'}
            onCancel={onClose}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
