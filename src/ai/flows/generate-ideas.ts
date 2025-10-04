
'use server';

/**
 * @fileOverview An AI agent to generate ideas for family development.
 *
 * - generateIdeas - A function that generates ideas based on a topic.
 * - GenerateIdeasInput - The input type for the generateIdeas function.
 * - GenerateIdeasOutput - The return type for the generateIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIdeasInputSchema = z.object({
  topic: z
    .string()
    .describe(
      'The topic for which to generate ideas. e.g., "family financial planning"'
    ),
});
export type GenerateIdeasInput = z.infer<typeof GenerateIdeasInputSchema>;

const GenerateIdeasOutputSchema = z.object({
  ideas: z.array(z.string()).describe('A list of generated ideas.'),
});
export type GenerateIdeasOutput = z.infer<typeof GenerateIdeasOutputSchema>;

export async function generateIdeas(
  input: GenerateIdeasInput
): Promise<GenerateIdeasOutput> {
  return generateIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIdeasPrompt',
  input: {schema: GenerateIdeasInputSchema},
  output: {schema: GenerateIdeasOutputSchema},
  prompt: `You are an expert consultant specializing in family development and unity.
A user is looking for ideas on the following topic: {{{topic}}}.

Brainstorm a list of 5 creative, actionable, and positive ideas to help a family grow and bond together related to this topic.
For each idea, provide a short, one-sentence description.
Present these ideas in a clear and concise list format.
`,
});

const generateIdeasFlow = ai.defineFlow(
  {
    name: 'generateIdeasFlow',
    inputSchema: GenerateIdeasInputSchema,
    outputSchema: GenerateIdeasOutputSchema,
  },
  async input => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: `You are an expert consultant specializing in family development and unity.
A user is looking for ideas on the following topic: ${input.topic}.

Brainstorm a list of 5 creative, actionable, and positive ideas to help a family grow and bond together related to this topic.
For each idea, provide a short, one-sentence description.
Present these ideas in a clear and concise list format.
`,
      output: {
        schema: GenerateIdeasOutputSchema,
      },
    });
    return llmResponse.output()!;
  }
);
