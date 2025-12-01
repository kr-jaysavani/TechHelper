import { NextResponse } from "next/server";
import { embed_pdf } from "@/rag/rag_agent";

export const runtime = "nodejs"; // Required if using file uploads

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        const file = formData.get("file") as File | null;
        console.log("🚀 ~ POST ~ file:", file?.name)
        const collection_name = formData.get("collection_name") as string | null;

        if (!file || !collection_name) {
        return NextResponse.json(
            { success: false, message: "Missing file or collection_name" },
            { status: 400 }
        );
        }

    // Call your existing embed function
    const result = await embed_pdf(file, collection_name);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("PDF Upload API Error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
