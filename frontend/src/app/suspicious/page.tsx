"use client"

import * as React from "react"
import { getSuspicious } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react"

import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LogDetail } from "@/components/log-detail"
import { TimeframeSelector } from "@/components/timeframe-selector"

export default function SuspiciousPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1")
  const timeframe = searchParams.get("days") || "7"

  const [data, setData] = React.useState([])
  const [totalPages, setTotalPages] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  const [selectedLog, setSelectedLog] = React.useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const days = parseInt(timeframe)
      const result = await getSuspicious(page, 10, days)
      setData(result.data || [])
      setTotalPages(result.pages || 1)
    } catch (error) {
      console.error("Failed to fetch suspicious logs:", error)
    } finally {
      setTimeout(() => setLoading(false), 50)
    }
  }, [page, timeframe])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      params.set(key, value.toString())
    })
    router.push(`/suspicious?${params.toString()}`)
  }

  return (
    <div className="flex flex-col flex-1 bg-muted/30">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 sticky top-0 z-10 justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-destructive to-destructive/60">
            Suspicious Activity
          </h1>
        </div>
        
        <TimeframeSelector />
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-destructive/10 shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Flagged Emails</CardTitle>
                  <CardDescription>
                    Emails identified as potentially suspicious based on bounces and rejections.
                  </CardDescription>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <ShieldAlert className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead>Message ID</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <TableRow key="loading">
                          <TableCell colSpan={6} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                              <p className="text-sm text-muted-foreground font-medium">Analyzing logs...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : data.length > 0 ? (
                        data.map((log: any, index: number) => (
                          <motion.tr
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="group hover:bg-muted/50 transition-colors border-b last:border-0 cursor-pointer"
                            onClick={() => {
                              setSelectedLog(log)
                              setIsDetailOpen(true)
                            }}
                          >
                            <TableCell className="whitespace-nowrap font-mono text-[10px] text-muted-foreground uppercase">
                              {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-muted-foreground/70">
                              {log.message_id}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate font-medium">
                              {log.sender}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate text-muted-foreground">
                              {log.recipient}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20 capitalize">
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-[11px] text-muted-foreground italic">
                              {log.reason || "-"}
                            </TableCell>
                          </motion.tr>
                        ))
                      ) : (
                        <TableRow key="empty">
                          <TableCell colSpan={6} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center opacity-30">
                              <ShieldAlert className="h-12 w-12 mb-2" />
                              <p className="text-lg font-medium">No suspicious logs found.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
                <div className="text-xs text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{data.length}</span> suspicious entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateParams({ page: Math.max(1, page - 1) })}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-xs font-medium">
                    {page} <span className="text-muted-foreground mx-1">/</span> {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })}
                    disabled={page === totalPages || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <LogDetail 
        log={selectedLog} 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
      />
    </div>
  )
}
