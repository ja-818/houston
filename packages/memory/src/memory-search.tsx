/**
 * MemorySearch -- Search input with debounced onChange.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@deck-ui/core"
import { Search } from "lucide-react"

export interface MemorySearchProps {
  value: string
  onChange: (query: string) => void
  placeholder?: string
}

export function MemorySearch({
  value,
  onChange,
  placeholder = "Search memories...",
}: MemorySearchProps) {
  const [local, setLocal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocal(value)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      setLocal(next)

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        onChange(next)
      }, 300)
    },
    [onChange],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}
