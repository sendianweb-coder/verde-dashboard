import { getProjectOptions } from '@/api/projects.api'
import MultipleSelector, { type Option } from '@/components/ui/multi-select'
import type { ProjectOption } from '@/types/project'

const OPTION_PAGE_SIZE = 20

interface ProjectOptionSelectProps {
  id: string
  value: string
  selectedOption: ProjectOption | null
  disabled?: boolean
  onChange: (option: ProjectOption | null) => void
}

const toOption = (project: ProjectOption): Option => ({ value: project.id, label: project.name })

export function ProjectOptionSelect({ id, value, selectedOption, disabled = false, onChange }: ProjectOptionSelectProps) {
  const selected = selectedOption?.id === value ? [toOption(selectedOption)] : []

  return (
    <MultipleSelector
      value={selected}
      defaultOptions={selected}
      maxSelected={1}
      disabled={disabled}
      placeholder="Search projects..."
      commandProps={{ label: 'Select project' }}
      inputProps={{ id, 'aria-label': 'Search projects' }}
      loadingIndicator={<p className="px-2 py-3 text-sm text-text-secondary" role="status">Loading projects...</p>}
      errorIndicator={<p className="px-2 py-3 text-sm text-error" role="alert">Unable to load projects.</p>}
      emptyIndicator={<p className="text-center text-sm text-text-secondary">No projects found.</p>}
      onSearch={async (search) => {
        const response = await getProjectOptions({ search: search.trim() || undefined, limit: OPTION_PAGE_SIZE, offset: 0 })
        return response.data.map(toOption)
      }}
      triggerSearchOnFocus
      onChange={(options) => {
        const option = options[0]
        onChange(option ? { id: option.value, name: option.label } : null)
      }}
      className="w-full"
    />
  )
}
