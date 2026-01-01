// // lib/ai/tools/image-classify.ts
// import { tool } from "ai";
// import { z } from "zod";

// export const imageClassify = tool({
//   description: "Classify images using Roboflow computer vision models. Accepts base64 encoded images or image URLs.",
//   inputSchema: z.object({
//     image: z.string().describe("Base64 encoded image string or image URL"),
//     modelId: z.string().describe("Roboflow model ID (e.g., 'your-model')"),
//     version: z.number().default(1).describe("Model version number"),
//     confidence: z.number().min(0).max(100).default(40).optional().describe("Minimum confidence threshold (0-100)"),
//   }),
//   execute: async (input) => {
//     try {
//       if (!process.env.ROBOFLOW_API_KEY) {
//         return {
//           error: "ROBOFLOW_API_KEY not configured",
//           modelId: input.modelId,
//         };
//       }

//       // Check if input is a URL or base64
//       let imageData = input.image;
//       if (input.image.startsWith('http://') || input.image.startsWith('https://')) {
//         // If it's a URL, fetch and convert to base64
//         const imageResponse = await fetch(input.image);
//         if (!imageResponse.ok) {
//           return {
//             error: `Failed to fetch image from URL: ${imageResponse.status}`,
//             modelId: input.modelId,
//           };
//         }
//         const buffer = await imageResponse.arrayBuffer();
//         imageData = Buffer.from(buffer).toString('base64');
//       }

//       const url = `https://classify.roboflow.com/${input.modelId}/${input.version}`;
//       const params = new URLSearchParams({
//         api_key: process.env.ROBOFLOW_API_KEY,
//         ...(input.confidence && { confidence: input.confidence.toString() }),
//       });

//       const response = await fetch(`${url}?${params}`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//         body: imageData,
//       });

//       if (!response.ok) {
//         return {
//           error: `Classification failed with status: ${response.status}`,
//           modelId: input.modelId,
//         };
//       }

//       const data = await response.json();

//       if (!data.predictions || data.predictions.length === 0) {
//         return {
//           error: "No classifications found",
//           modelId: input.modelId,
//         };
//       }

//       return {
//         modelId: input.modelId,
//         version: input.version,
//         predictions: data.predictions.map((pred: any) => ({
//           class: pred.class,
//           confidence: pred.confidence,
//         })),
//         top: data.top,
//         confidence: data.confidence,
//         classificationTime: new Date().toISOString(),
//       };
//     } catch (error) {
//       console.error("Image classification error:", error);
//       return {
//         error: error instanceof Error ? error.message : "Failed to classify image",
//         modelId: input.modelId,
//       };
//     }
//   },
// });

// lib/ai/tools/image-classify.ts
import { tool } from "ai";
import { z } from "zod";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export const imageClassify = tool({
  description: "Classify and analyze images using Roboflow Workflows. Accepts base64 encoded images or image URLs.",
  inputSchema: z.object({
    image: z.string().describe("image URL"),
    workspaceName: z.string().describe("Roboflow workspace name (e.g., 'learning-sx9ew')"),
    workflowId: z.string().describe("Workflow ID (e.g., 'custom-workflow-2')"),
  }),
  execute: async (input) => {
    const workspaceName = "learning-sx9ew";
    const workflowId = "custom-workflow-2"
    try {
      if (!process.env.ROBOFLOW_API_KEY) {
        return {
          error: "ROBOFLOW_API_KEY not configured",
          workflowId: input.workflowId,
        };
      }

      const imageResponse = await fetch(input.image);
      if (!imageResponse.ok) {
        return {
          error: `Failed to fetch image: ${imageResponse.status}`,
          workflowId: input.workflowId,
        };
      }

      const originalBuffer = Buffer.from(
        await imageResponse.arrayBuffer()
      );

      const compressedBuffer = await sharp(originalBuffer)
        .resize({
          width: 640,
          height: 640,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 70,
          mozjpeg: true,
        })
        .toBuffer();

      const base64Image = compressedBuffer.toString("base64");

      const base64SizeKB = (base64Image.length * 0.75) / 1024;
      console.log("🚀 ~ base64SizeKB:", base64SizeKB)
      if (base64SizeKB > 1300) {
        return {
          error: `Compressed image too large (${Math.round(
            base64SizeKB
          )} KB). Reduce size.`,
          workflowId: input.workflowId,
        };
      }


      //   // Check if input is a URL or base64
      let imageData = input.image;
  

      let url;
      if (process.env.IS_ROBOFLOW_LOCAL === "true") {
        url = `http://localhost:9001/infer/workflows/${workspaceName}/${workflowId}`;
      } else {
        url = `https://detect.roboflow.com/infer/workflows/${workspaceName}/${workflowId}`;
      }

      const payload = {
        api_key: process.env.ROBOFLOW_API_KEY,
        inputs: {
          image: {
            type: "base64",
            value: base64Image,
          },
          parameter: "some-value"
        },
      };

      const response = await fetch(`${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          //    "Authorization": "Bearer " + process.env.ROBOFLOW_API_KEY,
        },
        body: JSON.stringify(payload),
      });
      // console.log("🚀 ~ response:", response)

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Workflow failed with status: ${response.status}`,
          details: errorText,
          workflowId: input.workflowId,
        };
      }

      const data = await response.json();
      console.log("🚀 ~ data:", data?.outputs[0]?.predictions?.predictions);

     
      // If we have predictions and an input image, draw detections and save
      // the annotated image to `public/detections` so it can be served.
      let drawnImageUrl: string | undefined;
      try {
        // if (predictions && Array.isArray(predictions) && input.image) {
        const filename = `detections-${Date.now()}.jpg`;
        const outDir = path.join(process.cwd(), "public", "detections");
        const outPath = path.join(outDir, filename);

        await fs.promises.mkdir(outDir, { recursive: true });

        const annotatePayload = {
          image_url: input.image,
          predictions: data?.outputs[0]?.predictions?.predictions || [],
        };


        const annotedImageData = await fetch(`http://localhost:8000/annotate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(annotatePayload)  
        })
        // if (!annotedImageData.ok) {
        //   throw new Error("Failed to annotate image")
        // }
        const annotedImageInfo = await annotedImageData.json();
        let imageBase64 = annotedImageInfo.image_base64;

        // // If data URI, strip prefix
        // const commaIndex = imageBase64.indexOf(',');
        // if (commaIndex !== -1) {
        //   imageBase64 = imageBase64.slice(commaIndex + 1);
        // }
        const base64Data = imageBase64.includes(',')
          ? imageBase64.split(',')[1]
          : imageBase64;

        const buffer = Buffer.from(base64Data, 'base64');
        await fs.promises.writeFile(outPath, buffer);          
        drawnImageUrl = `/detections/${filename}`;
      } catch (err) {
        console.warn("Failed to draw detections:", err);
      }

      return {
        result: data?.outputs[0]?.predictions || [],
        drawnImageUrl: drawnImageUrl,
      };
    } catch (error) {
      console.error("Image classification error:", error);
      return {
        error: error instanceof Error ? error.message : "Failed to classify image",
        workflowId: input.workflowId,
      };
    }
  },
});