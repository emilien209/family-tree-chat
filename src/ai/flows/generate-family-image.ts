'use server';

/**
 * @fileOverview An AI agent to generate family-related images.
 *
 * - generateFamilyImage - A function that generates a family-related image.
 * - GenerateFamilyImageInput - The input type for the generateFamilyImage function.
 * - GenerateFamilyImageOutput - The return type for the generateFamilyImage function.
 */

import {ai} from '@/ai/genkit';
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

const prompt = ai.definePrompt({
  name: 'generateFamilyImagePrompt',
  input: {schema: GenerateFamilyImageInputSchema},
  output: {schema: GenerateFamilyImageOutputSchema},
  prompt: `Generate a family-friendly image based on the following description: {{{prompt}}}. The image should be suitable for use as a profile picture, header, or event invitation. Ensure the content is appropriate for all ages and reflects positive family values.`,
});

const generateFamilyImageFlow = ai.defineFlow(
  {
    name: 'generateFamilyImageFlow',
    inputSchema: GenerateFamilyImageInputSchema,
    outputSchema: GenerateFamilyImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: input.prompt + 'in a photorealistic style.'
    });
    if (!media) {
      throw new Error('No image was generated.');
    }
    return {imageUrl: media.url!};
  }
);
