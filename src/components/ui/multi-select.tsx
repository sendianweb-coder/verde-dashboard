'use client'

import * as React from 'react'
import { Command as CommandPrimitive, useCommandState } from 'cmdk'
import { XIcon } from 'lucide-react'

import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

export interface Option {
  value: string
  label: string
  disable?: boolean
  fixed?: boolean
  [key: string]: string | boolean | undefined
}

type GroupOption = Record<string, Option[]>

interface MultipleSelectorProps {
  value?: Option[]
  defaultOptions?: Option[]
  options?: Option[]
  placeholder?: string
  loadingIndicator?: React.ReactNode
  emptyIndicator?: React.ReactNode
  errorIndicator?: React.ReactNode
  delay?: number
  triggerSearchOnFocus?: boolean
  onSearch?: (value: string) => Promise<Option[]>
  onSearchSync?: (value: string) => Option[]
  onChange?: (options: Option[]) => void
  maxSelected?: number
  onMaxSelected?: (maxLimit: number) => void
  hidePlaceholderWhenSelected?: boolean
  disabled?: boolean
  groupBy?: string
  className?: string
  badgeClassName?: string
  selectFirstItem?: boolean
  creatable?: boolean
  commandProps?: React.ComponentPropsWithoutRef<typeof Command>
  inputProps?: Omit<React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>, 'value' | 'placeholder' | 'disabled'>
  hideClearAllButton?: boolean
}

export interface MultipleSelectorRef {
  selectedValue: Option[]
  input: HTMLInputElement | null
  focus: () => void
  reset: () => void
}

function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timer)
  }, [delay, value])

  return debouncedValue
}

function toGroups(options: Option[], groupBy?: string): GroupOption {
  return options.reduce<GroupOption>((groups, option) => {
    const key = groupBy ? String(option[groupBy] ?? '') : ''
    ;(groups[key] ??= []).push(option)
    return groups
  }, {})
}

function removeSelected(groups: GroupOption, selected: Option[]): GroupOption {
  const selectedValues = new Set(selected.map((option) => option.value))
  return Object.fromEntries(Object.entries(groups).map(([key, options]) => [key, options.filter((option) => !selectedValues.has(option.value))]))
}

function hasOption(groups: GroupOption, value: string) {
  return Object.values(groups).some((options) => options.some((option) => option.value === value))
}

function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  const isEmpty = useCommandState((state) => state.filtered.count === 0)
  if (!isEmpty) return null

  return <div className={cn('px-2 py-4 text-center text-sm', className)} cmdk-empty='' role="presentation" {...props} />
}

const MultipleSelector = React.forwardRef<MultipleSelectorRef, MultipleSelectorProps>(function MultipleSelector(
  {
    value,
    onChange,
    placeholder,
    defaultOptions = [],
    options: controlledOptions,
    delay,
    onSearch,
    onSearchSync,
    loadingIndicator,
    emptyIndicator,
    errorIndicator,
    maxSelected = Number.MAX_SAFE_INTEGER,
    onMaxSelected,
    hidePlaceholderWhenSelected,
    disabled,
    groupBy,
    className,
    badgeClassName,
    selectFirstItem = true,
    creatable = false,
    triggerSearchOnFocus = false,
    commandProps,
    inputProps,
    hideClearAllButton = false,
  },
  ref,
) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  const [onScrollbar, setOnScrollbar] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasSearchError, setHasSearchError] = React.useState(false)
  const [uncontrolledSelected, setUncontrolledSelected] = React.useState<Option[]>(value ?? [])
  const [searchedOptions, setSearchedOptions] = React.useState<Option[] | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const debouncedSearchTerm = useDebounce(inputValue, delay)
  const selected = value ?? uncontrolledSelected
  const staticOptions = controlledOptions ?? defaultOptions
  const groups = React.useMemo(() => toGroups(searchedOptions ?? staticOptions, groupBy), [groupBy, searchedOptions, staticOptions])
  const selectables = React.useMemo(() => removeSelected(groups, selected), [groups, selected])

  const updateSelected = React.useCallback(
    (next: Option[]) => {
      if (value === undefined) setUncontrolledSelected(next)
      onChange?.(next)
    },
    [onChange, value],
  )

  const unselect = React.useCallback(
    (option: Option) => {
      if (!option.fixed) updateSelected(selected.filter((selectedOption) => selectedOption.value !== option.value))
    },
    [selected, updateSelected],
  )

  const select = React.useCallback(
    (option: Option) => {
      if (selected.length >= maxSelected) {
        onMaxSelected?.(maxSelected)
        return
      }
      setInputValue('')
      updateSelected([...selected, option])
    },
    [maxSelected, onMaxSelected, selected, updateSelected],
  )

  React.useImperativeHandle(
    ref,
    () => ({
      selectedValue: selected,
      input: inputRef.current,
      focus: () => inputRef.current?.focus(),
      reset: () => updateSelected(selected.filter((option) => option.fixed)),
    }),
    [selected, updateSelected],
  )

  React.useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node) && !inputRef.current?.contains(event.target as Node)) {
        setOpen(false)
        inputRef.current?.blur()
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleOutside)
      document.addEventListener('touchend', handleOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchend', handleOutside)
    }
  }, [open])

  React.useEffect(() => {
    if (!open || !onSearchSync || (!triggerSearchOnFocus && !debouncedSearchTerm)) return

    let cancelled = false
    Promise.resolve(onSearchSync(debouncedSearchTerm)).then((results) => {
      if (!cancelled) setSearchedOptions(results)
    })
    return () => {
      cancelled = true
    }
  }, [debouncedSearchTerm, onSearchSync, open, triggerSearchOnFocus])

  React.useEffect(() => {
    if (!open || !onSearch || (!triggerSearchOnFocus && !debouncedSearchTerm)) return

    let cancelled = false
    const search = async () => {
      setIsLoading(true)
      setHasSearchError(false)
      try {
        const results = await onSearch(debouncedSearchTerm)
        if (!cancelled) setSearchedOptions(results)
      } catch {
        if (!cancelled) setHasSearchError(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void search()
    return () => {
      cancelled = true
    }
  }, [debouncedSearchTerm, onSearch, open, triggerSearchOnFocus])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === 'Delete' || event.key === 'Backspace') && inputRef.current?.value === '' && selected.length > 0) {
      unselect(selected.at(-1)!)
    }
    if (event.key === 'Escape') inputRef.current?.blur()
  }

  const creatableItem =
    creatable &&
    inputValue.length > 0 &&
    !hasOption(groups, inputValue) &&
    !selected.some((option) => option.value === inputValue) &&
    (!onSearch || (debouncedSearchTerm.length > 0 && !isLoading)) ? (
      <CommandItem
        value={inputValue}
        className="cursor-pointer"
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onSelect={(nextValue) => select({ value: nextValue, label: nextValue })}
      >
        {`Create "${inputValue}"`}
      </CommandItem>
    ) : null

  const showRemoteEmpty = Boolean(onSearch && !creatable && Object.keys(groups).length === 0 && emptyIndicator)

  return (
    <Command
      ref={dropdownRef}
      {...commandProps}
      onKeyDown={(event) => {
        handleKeyDown(event)
        commandProps?.onKeyDown?.(event)
      }}
      className={cn('h-auto overflow-visible bg-transparent', commandProps?.className)}
      shouldFilter={commandProps?.shouldFilter ?? !onSearch}
      filter={
        commandProps?.filter ??
        (creatable ? (optionValue, search) => (optionValue.toLowerCase().includes(search.toLowerCase()) ? 1 : -1) : undefined)
      }
    >
      <div
        className={cn(
          'relative min-h-9 rounded-md border border-border text-sm outline-none transition-[color,box-shadow] focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50',
          selected.length > 0 && 'p-1',
          selected.length > 0 && !disabled && 'cursor-text',
          !hideClearAllButton && 'pr-9',
          className,
        )}
        onClick={() => {
          if (!disabled) inputRef.current?.focus()
        }}
      >
        <div className="flex flex-wrap gap-1">
          {selected.map((option) => (
            <div
              key={option.value}
              className={cn(
                'relative inline-flex h-7 cursor-default items-center rounded-md border border-border bg-background py-0 pr-7 pl-2 text-xs font-medium text-text-secondary',
                option.fixed && 'pr-2',
                badgeClassName,
              )}
            >
              {option.label}
              {!option.fixed ? (
                <button
                  type="button"
                  className="absolute -inset-y-px -right-px flex size-7 items-center justify-center rounded-r-md text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/20"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  onClick={() => unselect(option)}
                  disabled={disabled}
                  aria-label={`Remove ${option.label}`}
                >
                  <XIcon size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ))}
          <CommandPrimitive.Input
            {...inputProps}
            ref={inputRef}
            value={inputValue}
            disabled={disabled}
            onValueChange={(nextValue) => {
              setInputValue(nextValue)
              inputProps?.onValueChange?.(nextValue)
            }}
            onBlur={(event) => {
              if (!onScrollbar) setOpen(false)
              inputProps?.onBlur?.(event)
            }}
            onFocus={(event) => {
              setOpen(true)
              inputProps?.onFocus?.(event)
            }}
            placeholder={hidePlaceholderWhenSelected && selected.length > 0 ? '' : placeholder}
            className={cn(
              'min-w-20 flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed',
              hidePlaceholderWhenSelected && 'w-full',
              selected.length === 0 ? 'px-3 py-2' : 'ml-1',
              inputProps?.className,
            )}
          />
          <button
            type="button"
            className={cn(
              'absolute top-0 right-0 flex size-9 items-center justify-center rounded-md text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/20',
              (hideClearAllButton || disabled || selected.length === 0 || selected.every((option) => option.fixed)) && 'hidden',
            )}
            onClick={() => updateSelected(selected.filter((option) => option.fixed))}
            aria-label="Clear all selections"
          >
            <XIcon size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="relative">
        <div
          className={cn(
            'absolute top-2 z-10 w-full overflow-hidden rounded-md border border-border bg-background shadow-lg',
            !open && 'hidden',
          )}
        >
          {open ? (
            <CommandList
              className="bg-background text-text-primary outline-none"
              onMouseLeave={() => setOnScrollbar(false)}
              onMouseEnter={() => setOnScrollbar(true)}
              onMouseUp={() => inputRef.current?.focus()}
            >
              {isLoading ? (
                loadingIndicator
              ) : hasSearchError ? (
                errorIndicator ?? <p className="px-2 py-3 text-sm text-error">Unable to load options.</p>
              ) : (
                <>
                  {showRemoteEmpty ? <CommandItem value="-" disabled>{emptyIndicator}</CommandItem> : <CommandEmpty>{emptyIndicator}</CommandEmpty>}
                  {creatableItem}
                  {!selectFirstItem ? <CommandItem value="-" className="hidden" /> : null}
                  {Object.entries(selectables).map(([group, options]) => (
                    <CommandGroup key={group} heading={group || undefined} className="h-full overflow-auto">
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disable}
                          className={cn('cursor-pointer', option.disable && 'pointer-events-none cursor-not-allowed opacity-50')}
                          onMouseDown={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                          }}
                          onSelect={() => select(option)}
                        >
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </>
              )}
            </CommandList>
          ) : null}
        </div>
      </div>
    </Command>
  )
})

MultipleSelector.displayName = 'MultipleSelector'

export default MultipleSelector
