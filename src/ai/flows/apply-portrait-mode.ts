'use server';
/**
 * @fileOverview AI flow to apply a portrait mode effect to an image, blurring the background.
 *
 * - applyPortraitMode - A function that applies a portrait mode (bokeh) effect.
 * - ApplyPortraitModeInput - The input type for the applyPortraitMode function.
 * - ApplyPortraitModeOutput - The return type for the applyPortraitMode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ApplyPortraitModeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be edited, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  style: z
    .string()
    .optional()
    .describe('An optional style to apply to the final image (e.g., Vivid, Dramatic, Black and White).'),
});
export type ApplyPortraitModeInput = z.infer<typeof ApplyPortraitModeInputSchema>;

const ApplyPortraitModeOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe("The edited image with portrait mode effect, as a data URI."),
});
export type ApplyPortraitModeOutput = z.infer<typeof ApplyPortraitModeOutputSchema>;

export async function applyPortraitMode(
  input: ApplyPortraitModeInput
): Promise<ApplyPortraitModeOutput> {
  return applyPortraitModeFlow(input);
}

const applyPortraitModeFlow = ai.defineFlow(
  {
    name: 'applyPortraitModeFlow',
    inputSchema: ApplyPortraitModeInputSchema,
    outputSchema: ApplyPortraitModeOutputSchema,
  },
  async ({ photoDataUri, style }) => {
    let promptText = `You are a professional photographer's editing assistant. Your task is to apply a realistic portrait mode (bokeh) effect to an image.

Redraw the provided image so the main subject is in sharp focus and the background is smoothly and realistically blurred according to depth. The effect should look like it was created with a high-end DSLR camera using a wide-aperture lens. Do not crop or change the aspect ratio of the image.`;

    if (style && style !== 'Natural') {
        promptText += `\n\nAlso, apply the following style to the final image: ${style}.`;
    }

    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: [
            { media: { url: photoDataUri } },
            { text: promptText },
        ],
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });

    if (!media?.url) {
        throw new Error('Image generation failed.');
    }

    return { imageDataUri: media.url };
  }
);
