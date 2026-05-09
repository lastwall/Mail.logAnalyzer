"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Mail, 
  Clock, 
  Shield, 
  AlertCircle, 
  Terminal, 
  User, 
  ArrowRight,
  Server,
  Fingerprint,
  Maximize2
} from "lucide-react"

interface LogDetailProps {
  log: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogDetail({ log, open, onOpenChange }: LogDetailProps) {
  if (!log) return null

  const statusColors = {
    sent: "border-green-500/20 text-green-600 bg-green-500/5",
    bounced: "border-destructive/20 text-destructive bg-destructive/5",
    deferred: "border-orange-500/20 text-orange-600 bg-orange-500/5",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 gap-0 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-muted/50 to-background h-full flex flex-col">
          {/* Header Bar */}
          <div className="px-8 py-6 border-b bg-background/50 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Maximize2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight">Email Diagnostic</DialogTitle>
                  <DialogDescription className="text-sm font-medium">
                    Deep forensic analysis of transaction <span className="font-mono text-primary">{log.message_id}</span>
                  </DialogDescription>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pr-8">
              {log.is_suspicious && (
                <Badge variant="destructive" className="animate-pulse gap-1 py-1 px-3">
                  <Shield className="h-3 w-3" /> THREAT DETECTED
                </Badge>
              )}
              <Badge 
                variant={log.status === "sent" ? "outline" : "destructive"}
                className={`${statusColors[log.status as keyof typeof statusColors] || ""} py-1 px-3`}
              >
                {log.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-y-auto flex-1">
            {/* Left Column: Metadata & Flow */}
            <div className="lg:col-span-5 space-y-8 h-full">
              {/* Summary Card */}
              <div className="bg-background rounded-2xl border p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Timestamp
                  </span>
                  <p className="text-xs font-semibold">
                    {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <Separator className="opacity-50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5" /> Relay IP
                  </span>
                  <p className="text-xs font-mono font-bold text-primary">
                    {log.client_ip || "127.0.0.1"}
                  </p>
                </div>
              </div>

              {/* Path Visualization */}
              <div className="relative pl-2 space-y-6">
                <div className="absolute left-[21px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-primary/30 via-muted to-primary/30 dashed border-l-2 border-dashed border-primary/20" />
                
                <div className="relative flex items-center gap-4">
                  <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-xl ring-4 ring-background">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Source Sender</span>
                    <div className="p-3 rounded-xl bg-background border shadow-sm border-primary/10">
                      <p className="text-sm font-mono break-all font-bold">
                        {log.sender}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center gap-4">
                  <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/20 shadow-lg ring-4 ring-background">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Destination Target</span>
                    <div className="p-3 rounded-xl bg-background border shadow-sm">
                      <p className="text-sm font-mono break-all font-bold">
                        {log.recipient}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {log.reason && (
                <div className="bg-destructive/5 border-2 border-destructive/10 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive" />
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-xs uppercase font-black tracking-widest text-destructive">Failure Analysis</span>
                  </div>
                  <div className="bg-background/60 p-3 rounded-lg border border-destructive/10">
                    <p className="text-[13px] text-destructive font-mono leading-relaxed break-words font-medium">
                      {log.reason}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Large Terminal */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase font-black tracking-widest text-muted-foreground">Full Transaction Evidence</span>
                </div>
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-500/30" />
                  <div className="h-2 w-2 rounded-full bg-amber-500/30" />
                  <div className="h-2 w-2 rounded-full bg-emerald-500/30" />
                </div>
              </div>

              <div className="bg-slate-950 text-slate-300 rounded-2xl font-mono text-[12px] leading-relaxed overflow-hidden shadow-2xl border border-slate-800 h-[500px] flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-3 w-3 text-slate-500" />
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">postfix_relay_trace_{log.message_id}.log</span>
                  </div>
                  <span className="text-[8px] text-slate-600">UTF-8 • BASH</span>
                </div>
                
                <div className="p-6 overflow-auto custom-scrollbar flex-1 bg-[radial-gradient(circle_at_top_right,rgba(15,23,42,0),rgba(15,23,42,1))]">
                  {log.raw_log ? (
                    <div className="grid grid-cols-[40px_1fr] gap-6">
                      {log.raw_log.split('\n').map((line: string, i: number) => (
                        <React.Fragment key={i}>
                          <span className="text-slate-700 text-right select-none font-bold opacity-40">{i + 1}</span>
                          <span className="whitespace-pre break-all">
                            {line.includes('status=sent') ? (
                              <span className="text-emerald-400 font-medium">{line}</span>
                            ) : line.includes('status=bounced') || line.includes('status=deferred') ? (
                              <span className="text-rose-400 font-medium">{line}</span>
                            ) : (
                              <span className="opacity-80">{line}</span>
                            )}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                      <Terminal className="h-12 w-12 opacity-10" />
                      <span className="italic text-sm">No forensic evidence found for this QID.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
