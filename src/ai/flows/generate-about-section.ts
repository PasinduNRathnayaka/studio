'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate content for the About section of the CineMagic application.
 *
 * - generateAboutSection - A function that generates the about section content.
 * - GenerateAboutSectionInput - The input type for the generateAboutSection function.
 * - GenerateAboutSectionOutput - The return type for the generateAboutSection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAboutSectionInputSchema = z.object({
  appName: z.string().describe('The name of the application.'),
  primaryColor: z.string().describe('The primary color of the application.'),
  backgroundColor: z.string().describe('The background color of the application.'),
  accentColor: z.string().describe('The accent color used in the application.'),
  font: z.string().describe('The font used in the application.'),
});
export type GenerateAboutSectionInput = z.infer<typeof GenerateAboutSectionInputSchema>;

const GenerateAboutSectionOutputSchema = z.object({
  aboutSectionContent: z.string().describe('The generated content for the About section.'),
});
export type GenerateAboutSectionOutput = z.infer<typeof GenerateAboutSectionOutputSchema>;

export async function generateAboutSection(input: GenerateAboutSectionInput): Promise<GenerateAboutSectionOutput> {
  return generateAboutSectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAboutSectionPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateAboutSectionInputSchema},
  output: {schema: GenerateAboutSectionOutputSchema},
  prompt: `You are an expert content writer specializing in creating engaging About sections for web applications.

You will use the following information to generate content for the About section of the application.

Application Name: {{{appName}}}
Primary Color: {{{primaryColor}}}
Background Color: {{{backgroundColor}}}
Accent Color: {{{accentColor}}}
Font: {{{font}}}

Write a concise and informative About section, highlighting the application's purpose, key features, and the AI technology used. The tone should be professional and inviting.
`,
});

const generateAboutSectionFlow = ai.defineFlow(
  {
    name: 'generateAboutSectionFlow',
    inputSchema: GenerateAboutSectionInputSchema,
    outputSchema: GenerateAboutSectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
