// Cosmetic browser chrome around generated output — traffic-light buttons
// and an address bar are decorative only, they don't minimize/close/etc.
export function BrowserWindow({ title, children, testId }: { title: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border shadow-sm" data-testid={testId}>
      <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 truncate rounded-md bg-background px-3 py-1 text-center text-xs text-muted-foreground">
          {title}
        </div>
      </div>
      <div className="bg-background p-6">{children}</div>
    </div>
  );
}
