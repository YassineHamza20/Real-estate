"use client"

export function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Platform analytics and insights</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Analytics content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}