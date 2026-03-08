'use client'

import Link from 'next/link'
import { BarChart2, ArrowRight, ShieldAlert } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8">
        <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <BarChart2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Analytics</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The open source release does not include the optional aggregate analytics Edge Function yet.
            You can still inspect request activity from the audit log stream.
          </p>

          <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left text-sm text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 font-medium text-amber-400">
              <ShieldAlert className="h-4 w-4" />
              Optional extension point
            </div>
            <p>
              If you want a dashboard-level analytics summary, add your own `get-analytics` Edge Function and update this page to match your schema.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/dashboard/audit"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-medium text-white hover:bg-accent/90 transition-colors"
            >
              Open Audit Logs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
