"use client"

import { Trash2, FileText, Download } from "lucide-react"

interface Pdf {
  id: string
  name: string
  size: number
  uploadedAt: Date
}

interface PdfListProps {
  pdfs: Pdf[]
  onDelete: (id: string) => void
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

export function formatDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}


export default function PdfList({ pdfs, onDelete }: PdfListProps) {
  if (pdfs.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-12 text-center">
        <div className="mb-4 flex justify-center">
          <FileText className="w-12 h-12 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground">No PDFs uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {pdfs.map((pdf) => (
        <div
          key={pdf.id}
          className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-card/80 transition-all duration-200"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{pdf.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatBytes(pdf.size)}</span>
                <span>•</span>
                <span>{formatDate(pdf.uploadedAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {/* <button
              type="button"
              className="p-2 hover:bg-secondary rounded-lg transition-colors duration-200"
              title="Download PDF"
            >
              <Download className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button> */}
            <button
              type="button"
              onClick={() => onDelete(pdf.id)}
              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors duration-200"
              title="Delete PDF"
            >
              <Trash2 className="w-5 h-5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
