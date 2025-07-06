'use server';
/**
 * @fileOverview AI flow to suggest cinematic color grade presets based on the content of an uploaded image.
 *
 * - suggestCinematicEdits - A function that suggests cinematic edits for an image.
 * - SuggestCinematicEditsInput - The input type for the suggestCinematicEdits function.
 * - SuggestCinematicEditsOutput - The return type for the suggestCinematicEdits function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCinematicEditsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be edited, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestCinematicEditsInput = z.infer<typeof SuggestCinematicEditsInputSchema>;

const SuggestCinematicEditsOutputSchema = z.object({
  suggestedEdits: z
    .array(z.string())
    .describe('An array of suggested cinematic color grade presets.'),
});
export type SuggestCinematicEditsOutput = z.infer<typeof SuggestCinematicEditsOutputSchema>;

export async function suggestCinematicEdits(
  input: SuggestCinematicEditsInput
): Promise<SuggestCinematicEditsOutput> {
  return suggestCinematicEditsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCinematicEditsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: SuggestCinematicEditsInputSchema},
  output: {schema: SuggestCinematicEditsOutputSchema},
  prompt: `You are a professional cinematic colorist. A user will upload an image, and you will suggest cinematic color grade presets based on the content of the image.

  Here is the image: {{media url=photoDataUri}}

  Suggest at least 3 different color grade presets that would be appropriate for the image.
  Return them as an array of strings.
  Do not explain your suggestions, just return the array.
  Presets can be color names, or styles such as "vintage", "noir", etc.
  `,
});

const suggestCinematicEditsFlow = ai.defineFlow(
  {
    name: 'suggestCinematicEditsFlow',
    inputSchema: SuggestCinematicEditsInputSchema,
    outputSchema: SuggestCinematicEditsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
