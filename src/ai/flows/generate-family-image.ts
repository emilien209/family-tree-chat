
'use server';

/**
 * @fileOverview An AI agent to generate family-related images.
 *
 * - generateFamilyImage - A function that generates a family-related image.
 * - GenerateFamilyImageInput - The input type for the generateFamilyImage function.
 * - GenerateFamilyImageOutput - The return type for the generateFamilyImage function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateFamilyImageInputSchema = z.object({
  prompt: z
    .string()
    .describe(
      'A prompt describing the image to generate, which will be used to generate a family-friendly image.'
    ),
});
export type GenerateFamilyImageInput = z.infer<typeof GenerateFamilyImageInputSchema>;

const GenerateFamilyImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The URL of the generated family-friendly image.'),
});
export type GenerateFamilyImageOutput = z.infer<typeof GenerateFamilyImageOutputSchema>;

export async function generateFamilyImage(
  input: GenerateFamilyImageInput
): Promise<GenerateFamilyImageOutput> {
  return generateFamilyImageFlow(input);
}

const generateFamilyImageFlow = ai.defineFlow(
  {
    name: 'generateFamilyImageFlow',
    inputSchema: GenerateFamilyImageInputSchema,
    outputSchema: GenerateFamilyImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: input.prompt
    });
    if (!media || !media.url) {
      throw new Error('No image was generated.');
    }
    return {imageUrl: media.url};
  }
);
