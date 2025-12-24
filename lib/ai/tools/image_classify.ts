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

export const imageClassify = tool({
  description: "Classify and analyze images using Roboflow Workflows. Accepts base64 encoded images or image URLs.",
  inputSchema: z.object({
    image: z.string().describe("image URL"),
    workspaceName: z.string().describe("Roboflow workspace name (e.g., 'learning-sx9ew')"),
    workflowId: z.string().describe("Workflow ID (e.g., 'custom-workflow-2')"),
  }),
  execute: async (input) => {
    console.log("🚀 ~ input:", input)
    try {
      if (!process.env.ROBOFLOW_API_KEY) {
        return {
          error: "ROBOFLOW_API_KEY not configured",
          workflowId: input.workflowId,
        };
      }

    //   // Check if input is a URL or base64
      let imageData = input.image;
    // let imageData = ""
    //   if (input.image.startsWith('http://') || input.image.startsWith('https://')) {
    //     // If it's a URL, fetch and convert to base64
    //     const imageResponse = await fetch(input.image);
    //     if (!imageResponse.ok) {
    //       return {
    //         error: `Failed to fetch image from URL: ${imageResponse.status}`,
    //         workflowId: input.workflowId,
    //       };
    //     }
    //     const buffer = await imageResponse.arrayBuffer();
    //     imageData = Buffer.from(buffer).toString('base64');
    //   }

    //   // Remove data URI prefix if present
    //   if (imageData.includes(',')) {
    //     imageData = imageData.split(',')[1];
    //   }

      const url = `https://detect.roboflow.com/infer/workflows/learning-sx9ew/custom-workflow-2`;
      
      const payload = {
        api_key:"h9Ivd81V7NRWdbJl35za",
        inputs: {
          image: {
            type: "url",
            value: imageData,
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
      console.log("🚀 ~ response:", response)

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Workflow failed with status: ${response.status}`,
          details: errorText,
          workflowId: input.workflowId,
        };
      }

      const data = await response.json();
      console.log("🚀 ~ data:", data?.outputs[0]?.predictions)

      return {
        result: data?.outputs[0]?.predictions
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