    "use client"

import type React from "react"

import { useRef, useState } from "react"
import { Upload } from "lucide-react"

interface PdfUploaderProps {
  onUpload: (files: File[]) => void
}

export default function PdfUploader({ onUpload }: PdfUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")

    if (files.length > 0) {
      onUpload(files)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      onUpload(files)
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
        isDragging ? "border-primary bg-primary/5 scale-105" : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <input ref={inputRef} type="file" accept=".pdf" onChange={handleInputChange} className="hidden" />

      <div
        className="flex flex-col items-center justify-center cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <div className="mb-4 p-3 bg-primary/10 rounded-full">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Drop your PDFs here</h3>
        <p className="text-muted-foreground text-sm mb-4">or click to select files from your computer</p>
        <button
          type="button"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          Browse Files
        </button>
      </div>
    </div>
  )
}
