"use client"

import * as React from "react"
import { processLogs, getSystemStatus } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function SettingsPage() {
  const [processing, setProcessing] = React.useState(false)
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = React.useState("")
  const [lastProcessed, setLastProcessed] = React.useState<string | null>(null)
  const [progress, setProgress] = React.useState(0)

  const fetchStatus = async () => {
    try {
      const data = await getSystemStatus()
      setLastProcessed(data.last_processed)
    } catch (e) {
      console.error(e)
    }
  }

  React.useEffect(() => {
    fetchStatus()
  }, [])

  // Simulate progress when processing
  React.useEffect(() => {
    let interval: any
    if (processing) {
      setProgress(0)
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 10))
      }, 1000)
    } else {
      setProgress(100)
      const timeout = setTimeout(() => setProgress(0), 1000)
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
    return () => clearInterval(interval)
  }, [processing])

  const handleProcessLogs = async () => {
    setProcessing(true)
    setStatus("idle")
    try {
      await processLogs()
      setStatus("success")
      setMessage("Log processing started in background...")
      
      // Poll for completion
      const currentLastProcessed = lastProcessed
      const pollInterval = setInterval(async () => {
        try {
          const data = await getSystemStatus()
          if (data.last_processed !== currentLastProcessed) {
            setLastProcessed(data.last_processed)
            setProcessing(false)
            clearInterval(pollInterval)
            setMessage("Log processing completed!")
          }
        } catch (e) {
          console.error("Polling error:", e)
        }
      }, 3000)

    } catch (error) {
      setStatus("error")
      setMessage("Failed to start log processing.")
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Card className="max-w-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Log Management</CardTitle>
            <CardDescription>
              Trigger manual log processing or configure automatic updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Process Mail Logs</p>
                  <p className="text-xs text-muted-foreground">
                    Scan the configured logs directory and update the database.
                  </p>
                </div>
                <Button 
                  onClick={handleProcessLogs} 
                  disabled={processing}
                  className="min-w-[120px]"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Process Now
                    </>
                  )}
                </Button>
              </div>

              {processing && (
                <div className="space-y-2 px-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                    <span>Parsing Logs...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}
            </div>

            {status === "success" && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/5 p-3 rounded-md border border-green-500/20">
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-md border border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                {message}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t bg-muted/10 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Last processed: {lastProcessed ? new Date(lastProcessed).toLocaleString() : "Not available"}
            </p>
          </CardFooter>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Details about the current environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-muted-foreground">Backend URL</div>
              <div className="font-mono">http://localhost:8001</div>
              <div className="text-muted-foreground">Logs Directory</div>
              <div className="font-mono">./logs</div>
              <div className="text-muted-foreground">Database</div>
              <div className="font-mono">SQLite (mail_analyzer_v2.db)</div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
