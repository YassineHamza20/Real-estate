"use client"

export function VerificationsTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seller Verifications</h2>
          <p className="text-muted-foreground">Review and manage seller verification requests</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Verifications management content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}