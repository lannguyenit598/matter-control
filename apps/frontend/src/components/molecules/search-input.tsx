import { Search, X } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Input, type InputProps } from '@/components/atoms/input'
import { LocalizedText } from '@/components/molecules/localized-text'
import { cn } from '@/lib/utils'

export type SearchInputProps = Omit<InputProps, 'type'> & {
  /** When provided, a clear button appears while the input has a value. */
  onClear?: () => void
}

export function SearchInput({ className, onClear, value, ...props }: SearchInputProps) {
  const showClear = onClear && value !== undefined && String(value).length > 0
  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        className={cn(
          'pl-8',
          showClear ? 'pr-14 [&::-webkit-search-cancel-button]:appearance-none' : 'pr-3',
        )}
        {...props}
      />
      {showClear && (
        <span className="absolute top-1/2 right-0.5 -translate-y-1/2">
          <Button
            variant="ghost"
            size="icon"
            disabled={props.disabled || props.readOnly}
            onClick={onClear}
          >
            <X aria-hidden />
            <span className="sr-only">
              <LocalizedText en="Clear search" vi="Xóa tìm kiếm" />
            </span>
          </Button>
        </span>
      )}
    </div>
  )
}
