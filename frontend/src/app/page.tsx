"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  ArrowUpRight,
  Mail,
  Send,
  ShieldAlert,
  XCircle,
  Calendar,
  Activity
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { motion, AnimatePresence } from "framer-motion"
import { StatsSkeleton, ChartSkeleton, ListSkeleton } from "@/components/loading-skeleton"
import { getOverview, getVolume, getSuspicious } from "@/lib/api"
import { useSearchParams } from "next/navigation"
import { TimeframeSelector } from "@/components/timeframe-selector"

const chartConfig = {
  count: {
    label: "Total Volume",
    color: "hsl(var(--primary))",
  },
  bounces: {
    label: "Bounces",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
  "hsl(var(--muted))",
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const timeframe = searchParams.get("days") || "7"
  
  const [stats, setStats] = React.useState({
    total: 0,
    sent: 0,
    bounced: 0,
    deferred: 0,
    success_rate: 0
  })
  const [volume, setVolume] = React.useState([])
  const [suspicious, setSuspicious] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const days = parseInt(timeframe)
      const [overviewData, volumeData, suspiciousData] = await Promise.all([
        getOverview(days),
        getVolume(days),
        getSuspicious(1, 5, days)
      ])
      setStats(overviewData)
      setVolume(volumeData)
      setSuspicious(suspiciousData.data || [])
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setTimeout(() => setLoading(false), 50)
    }
  }, [timeframe])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const pieData = [
    { name: "Sent", value: stats.sent },
    { name: "Bounced", value: stats.bounced },
    { name: "Deferred", value: stats.deferred },
  ].filter(d => d.value > 0)

  return (
    <div className="flex flex-col flex-1 bg-muted/30">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 sticky top-0 z-10 justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Dashboard
          </h1>
        </div>
        
        <TimeframeSelector />
      </header>
      
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <StatsSkeleton />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <ChartSkeleton className="col-span-4" />
                <ListSkeleton className="col-span-3" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <motion.div variants={item}>
                  <Card className="hover:shadow-md transition-all duration-300 border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                      <Mail className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Volume in selected period</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={item}>
                  <Card className="hover:shadow-md transition-all duration-300 border-green-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sent Successfully</CardTitle>
                      <Send className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.sent.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">{stats.success_rate}% success rate</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={item}>
                  <Card className="hover:shadow-md transition-all duration-300 border-destructive/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Bounced</CardTitle>
                      <XCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.bounced.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        {((stats.bounced / stats.total) * 100 || 0).toFixed(1)}% bounce rate
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={item}>
                  <Card className="hover:shadow-md transition-all duration-300 border-warning/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
                      <ShieldAlert className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{suspicious.length}</div>
                      <p className="text-xs text-muted-foreground">Flags in period</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Charts Row */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
                {/* Volume Bar Chart */}
                <motion.div variants={item} className="lg:col-span-8">
                  <Card className="hover:shadow-md transition-all duration-300 h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Traffic Overview</CardTitle>
                        <CardDescription>Daily mail throughput trend.</CardDescription>
                      </div>
                      <Activity className="h-4 w-4 text-muted-foreground opacity-30" />
                    </CardHeader>
                    <CardContent className="pl-2">
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={volume}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            fontSize={10}
                          />
                          <YAxis hide />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar 
                            dataKey="count" 
                            fill="var(--color-count)" 
                            radius={[4, 4, 0, 0]} 
                            className="fill-primary/80"
                            barSize={volume.length > 15 ? 10 : 20}
                          />
                          <Bar 
                            dataKey="bounces" 
                            fill="var(--color-bounces)" 
                            radius={[4, 4, 0, 0]} 
                            className="fill-destructive/80"
                            barSize={volume.length > 15 ? 10 : 20}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Delivery Health Pie Chart */}
                <motion.div variants={item} className="lg:col-span-4">
                  <Card className="hover:shadow-md transition-all duration-300 h-full">
                    <CardHeader>
                      <CardTitle className="text-base">Delivery Health</CardTitle>
                      <CardDescription>Status distribution ratio.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-0">
                      <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={85}
                              paddingAngle={5}
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={1000}
                            >
                              {pieData.map((entry, index) => {
                                // Hardcoded hex colors for SVG reliability
                                let color = "#3b82f6" // Blue-500 (Sent)
                                if (entry.name === "Bounced") color = "#ef4444" // Red-500 (Bounced)
                                if (entry.name === "Deferred") color = "#f59e0b" // Amber-500 (Deferred)
                                return <Cell key={`cell-${index}`} fill={color} stroke="none" />
                              })}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))', 
                                borderRadius: '12px', 
                                border: '1px solid hsl(var(--border))',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-3xl font-black">{stats.success_rate}%</span>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Success</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 w-full mt-2 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
                            <span className="text-xs font-medium">Sent</span>
                          </div>
                          <span className="text-xs font-bold">{stats.sent.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                            <span className="text-xs font-medium text-destructive">Bounced</span>
                          </div>
                          <span className="text-xs font-bold text-destructive">{stats.bounced.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                            <span className="text-xs font-medium text-warning">Deferred</span>
                          </div>
                          <span className="text-xs font-bold text-warning">{stats.deferred.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Bottom Row: Detailed Bounces & Recent Activity */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <motion.div variants={item} className="col-span-4">
                   <Card className="hover:shadow-md transition-all duration-300 h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Bounce Trends</CardTitle>
                        <CardDescription>Daily rejected mail volume.</CardDescription>
                      </CardHeader>
                      <CardContent className="pl-2">
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                          <BarChart data={volume}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              tickMargin={10}
                              axisLine={false}
                              fontSize={10}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar 
                              dataKey="bounces" 
                              fill="var(--color-bounces)" 
                              radius={[4, 4, 0, 0]} 
                              className="fill-destructive/80"
                            />
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                </motion.div>
                
                <motion.div variants={item} className="col-span-3">
                  <Card className="hover:shadow-md transition-all duration-300 h-full">
                    <CardHeader>
                      <CardTitle className="text-base">Recent Suspicious</CardTitle>
                      <CardDescription>Latest flagged activities in timeframe.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {suspicious.length > 0 ? suspicious.map((log: any) => (
                          <div key={log.id} className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors group cursor-default">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                              <ShieldAlert className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="flex flex-1 flex-col overflow-hidden">
                              <p className="text-sm font-bold truncate">{log.sender}</p>
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {log.reason}
                              </p>
                            </div>
                            <div className="ml-auto font-bold text-[10px] text-muted-foreground uppercase tabular-nums">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <ShieldAlert className="h-10 w-10 mb-4 opacity-10" />
                            <p className="text-sm">Clear for this period</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
