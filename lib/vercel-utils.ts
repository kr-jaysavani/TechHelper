import { put, list, del } from "@vercel/blob";
import { blob } from "stream/consumers";


export async function upload_to_vercel(file: Blob) {

    try {
        const filename = (file as File).name
        const fileBuffer = await file.arrayBuffer();
        const uploadedFiles = await list();

        if (uploadedFiles.blobs.some((blob) => blob.pathname === filename)) {
            return {
                success: true,
                alreadyUploaded: true,
                message: "Already uploaded on vercel.",
                data: undefined
            }
        }
        const data = await put(`${filename}`, fileBuffer, {
            access: "public"
        })
        console.log("🚀 ~ upload_to_vercel ~ data:", JSON.stringify(data))

        return {
            success: true,
            alreadyUploaded: false,
            message: `${filename} uploaded to vercel successfully.`,
            data
        }
    } catch (error) {
        console.error(`Error while uploading file to vercel:  ${error}`);
        return {
            success: false,
            message: "Error while uploading file to vercel",
            data: undefined
        }
    }
}

export async function delete_from_vercel(fileName: string) {
    try {
        const allFiles = await list();
        const fileToDelete = allFiles.blobs.filter((blob) => blob.pathname === fileName);
        if (!fileToDelete || fileToDelete.length === 0) {
            return {
                success: false,
                message: "No such file found."
            }
        }
        await del(fileToDelete[0].url);
        return {
            success: true,
            message: `${fileName} deleted successfully...`
        }
    } catch (error) {
        console.error(`Error while deleting from vercel : ${error}`);
        return {
            success: false,
            message: "Error while deleting from vercel"
        }
    }
}