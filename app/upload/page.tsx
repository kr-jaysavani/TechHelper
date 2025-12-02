"use client"

import { useEffect, useState } from "react"
import PdfList from "@/components/pdf-list"
import PdfUploader from "@/components/pdf-uploader";
import { delete_collection, embed_pdf } from "@/rag/rag_agent";

export default function Home() {
  const [uploadedPdfs, setUploadedPdfs] = useState<Array<{ id: string; name: string; size: number; uploadedAt: Date }>>(
    [],
  )

  const handlePdfUpload = async(files: File[]) => {
    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("collection_name", files[0].name.replace(".pdf",""));

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const newPdfs = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
    }))

    const data = await res.json();
    console.log("Embed response:", data);
    setUploadedPdfs((prev) => [...prev, ...newPdfs])
  }

  const handleDeletePdf = async(id: string) => {
    
    const collection = uploadedPdfs.filter((f) => f.id === id);
    const c_name = collection[0].name;
    if(!collection || collection.length === 0 ) throw new Error("No such collection to delete.")
    await delete_collection(collection[0].name)
    setUploadedPdfs((prev) => prev.filter((pdf) => pdf.id !== id))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with Theme Toggle */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Troubleshoot Agent</h1>
            <p className="text-muted-foreground mt-1">Upload and manage PDF documents</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Upload Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Upload Documents</h2>
              <p className="text-muted-foreground text-sm">Drag and drop your PDF files or click to browse</p>
            </div>
            <PdfUploader onUpload={handlePdfUpload} />
          </section>

          {/* Files List Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Uploaded Files</h2>
              <p className="text-muted-foreground text-sm">
                {uploadedPdfs.length} {uploadedPdfs.length === 1 ? "file" : "files"} uploaded
              </p>
            </div>
            <PdfList pdfs={uploadedPdfs} onDelete={handleDeletePdf} />
          </section>
        </div>
      </main>
    </div>
  )
}
