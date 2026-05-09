"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Calendar } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TimeframeSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const currentDays = searchParams.get("days") || "7"

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("days", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={currentDays} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[160px] h-9 bg-background/50 border-primary/10">
          <SelectValue placeholder="Select timeframe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Last 24 Hours</SelectItem>
          <SelectItem value="7">Last 7 Days</SelectItem>
          <SelectItem value="30">Last 30 Days</SelectItem>
          <SelectItem value="0">All Time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
