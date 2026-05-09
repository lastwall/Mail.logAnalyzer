"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from "recharts"
import { TrendingUp, AlertCircle, Users, Mail } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { getTopSenders, getBouncesBySender } from "@/lib/api"
import { ListSkeleton } from "@/components/loading-skeleton"
import { useRouter, useSearchParams } from "next/navigation"
import { TimeframeSelector } from "@/components/timeframe-selector"

export default function AnalyticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const timeframe = searchParams.get("days") || "7"
  
  const [topSenders, setTopSenders] = React.useState([])
  const [topBounces, setTopBounces] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  const handleSenderClick = (sender: string, type: "all" | "bounced" = "all") => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("search", sender)
    if (type === "bounced") {
      params.set("status", "bounced")
    } else {
      params.delete("status")
    }
    router.push(`/logs?${params.toString()}`)
  }

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const days = parseInt(timeframe)
      const [senders, bounces] = await Promise.all([
        getTopSenders(10, days),
        getBouncesBySender(10, days)
      ])
      setTopSenders(senders)
      setTopBounces(bounces)
    } catch (error) {
      console.error("Failed to fetch analytics data:", error)
    } finally {
      setTimeout(() => setLoading(false), 50)
    }
  }, [timeframe])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="flex flex-col flex-1 bg-muted/30">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 sticky top-0 z-10 justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Sender Analytics
          </h1>
        </div>
        
        <TimeframeSelector />
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Senders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="h-full shadow-sm">
              <CardHeader className="border-b bg-muted/10">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Highest Senders</CardTitle>
                    <CardDescription>Accounts with the most email volume.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <ListSkeleton />
                ) : (
                  <div className="space-y-6">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topSenders} layout="vertical" margin={{ left: 40, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="sender" 
                            type="category" 
                            width={100} 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <RechartsTooltip 
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-background border rounded-lg p-2 shadow-sm text-xs">
                                    <p className="font-medium">{payload[0].payload.sender}</p>
                                    <p className="text-muted-foreground">{payload[0].value} emails</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="hsl(var(--primary))" 
                            radius={[0, 4, 4, 0]} 
                            barSize={20} 
                            onClick={(data) => handleSenderClick(data.sender)}
                            className="cursor-pointer"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {topSenders.map((item: any, i: number) => (
                        <div 
                          key={i} 
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => handleSenderClick(item.sender)}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                            <span className="text-sm truncate font-medium">{item.sender}</span>
                          </div>
                          <span className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded text-primary">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Highest Bounces */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="h-full shadow-sm border-destructive/10">
              <CardHeader className="border-b bg-muted/10">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <CardTitle>Highest Bounces</CardTitle>
                    <CardDescription>Accounts with the most rejected emails.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <ListSkeleton />
                ) : (
                  <div className="space-y-6">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topBounces} layout="vertical" margin={{ left: 40, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="sender" 
                            type="category" 
                            width={100} 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <RechartsTooltip 
                             cursor={{ fill: 'transparent' }}
                             content={({ active, payload }) => {
                               if (active && payload && payload.length) {
                                 return (
                                   <div className="bg-background border rounded-lg p-2 shadow-sm text-xs">
                                     <p className="font-medium">{payload[0].payload.sender}</p>
                                     <p className="text-destructive font-medium">{payload[0].value} bounces</p>
                                   </div>
                                 )
                               }
                               return null
                             }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="hsl(var(--destructive))" 
                            radius={[0, 4, 4, 0]} 
                            barSize={20} 
                            onClick={(data) => handleSenderClick(data.sender, "bounced")}
                            className="cursor-pointer"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {topBounces.length > 0 ? topBounces.map((item: any, i: number) => (
                        <div 
                          key={i} 
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => handleSenderClick(item.sender, "bounced")}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                            <span className="text-sm truncate font-medium">{item.sender}</span>
                          </div>
                          <span className="text-sm font-mono bg-destructive/10 px-2 py-0.5 rounded text-destructive">
                            {item.count}
                          </span>
                        </div>
                      )) : (
                        <div className="text-center py-10 text-muted-foreground italic text-sm">
                          No bounces found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
