import { NextResponse } from "next/server";
import { delete_collection, embed_pdf, get_collections } from "@/rag/rag_agent";
import { createUserFile } from "@/lib/db/queries";
import { getSession } from "next-auth/react";
import { auth } from "@/app/(auth)/auth";
import { delete_from_vercel, upload_to_vercel } from "@/lib/vercel-utils";

export async function POST(req: Request) {
  const session = await auth();
  console.log("🚀 ~ POST ~ session:", session);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    console.log("🚀 ~ POST ~ file:", file?.name);
    const collection_name = formData.get("collection_name") as string | null;

    if (!file || !collection_name) {
      return NextResponse.json(
        { success: false, message: "Missing file or collection_name" },
        { status: 400 }
      );
    }

    const uploadedData = await upload_to_vercel(file);
    console.log("🚀 ~ POST ~ uploadedData:", uploadedData.message)
    if (!uploadedData || !uploadedData.success) {
      return NextResponse.json(
        { success: false, message: "Something went wrong while uploading file to vercel." },
        { status: 500 }
      )
    }

    // Call your existing embed function
    const result = await embed_pdf(file, collection_name);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Failed to embed PDF" },
        { status: 500 }
      );
    }

    if (!uploadedData.alreadyUploaded) {
      await createUserFile({
        userId: session?.user?.id,
        fileUrl: uploadedData.data?.url ?? "",
        collectionName: collection_name,
        status: uploadedData.success ? "success" : "pending"
      })
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
  try {
    const { collection_name } = await req.json();
    const { success } = await delete_collection(collection_name);
    const res = await delete_from_vercel(collection_name + ".pdf")
    console.log("🚀 ~ DELETE ~ res :", res)
    if (success) {
      return NextResponse.json(
        {
          success: true,
          message: `Collection ${collection_name} deleted successfully`,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to delete collection ${collection_name}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log(`Error while deleting pdf ${error}`)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to delete collection...`,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const collections = await get_collections();
  return NextResponse.json({
    collections,
  });
}
