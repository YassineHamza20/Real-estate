"use client"

export function PropertyImagesTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Property Images</h2>
          <p className="text-muted-foreground">Manage property images and moderation</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Property images management content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}