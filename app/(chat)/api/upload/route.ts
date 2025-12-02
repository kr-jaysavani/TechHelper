import { NextResponse } from "next/server";
import { delete_collection, embed_pdf, get_collections } from "@/rag/rag_agent";
import { createUserFile } from "@/lib/db/queries";
import { getSession } from "next-auth/react";
import { auth } from "@/app/(auth)/auth";

export async function POST(req: Request) {

  const session = await auth();
    console.log("🚀 ~ POST ~ session:", session)
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
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Failed to embed PDF" },
        { status: 500 }
      );
    }
    else{
      try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      console.log("🚀 ~ POST ~ response:", response)

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;
        console.log("🚀 ~ POST ~ url:", url)

        await createUserFile({
          userId: session?.data?.user?.id || "",
          fileUrl: url,
          collectionName: collection_name,
        })

        // return {
        //   url,
        //   name: pathname,
        //   contentType,
        // };
      }
      const { error } = await response.json();
      console.error("File Upload Error:", error);
    } catch (_error) {
      console.error("File Upload Error:", _error);
    }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("PDF Upload API Error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { collection_name } = await req.json();
    const {success} = await delete_collection(collection_name);
    if(success) {
      return NextResponse.json(
        { success: true, message: `Collection ${collection_name} deleted successfully` },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: `Failed to delete collection ${collection_name}` },
        { status: 500 }
      );
    } 
}

export async function GET(req: Request) {
    const collections = await get_collections();
    return NextResponse.json({
      collections
    });
}