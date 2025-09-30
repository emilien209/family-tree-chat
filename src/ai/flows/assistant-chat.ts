'use server';

/**
 * @fileOverview A conversational AI assistant for the application.
 *
 * - assistantChat - A function that provides answers and suggestions.
 * - AssistantChatInput - The input type for the assistantChat function.
 * - AssistantChatOutput - The return type for the assistantChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssistantChatInputSchema = z.object({
  question: z
    .string()
    .describe('The user\'s question or prompt for the assistant.'),
});
export type AssistantChatInput = z.infer<typeof AssistantChatInputSchema>;

const AssistantChatOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response.'),
});
export type AssistantChatOutput = z.infer<typeof AssistantChatOutputSchema>;

export async function assistantChat(
  input: AssistantChatInput
): Promise<AssistantChatOutput> {
  return assistantChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assistantChatPrompt',
  input: {schema: AssistantChatInputSchema},
  output: {schema: AssistantChatOutputSchema},
  prompt: `You are a helpful AI assistant for a family-centric social media application.
Your role is to:
1.  Answer user questions about how to use the application.
2.  Provide creative ideas for new features or improvements if asked.
3.  Be friendly, supportive, and encourage family connection.

User's question: {{{question}}}

Based on the question, provide a clear, helpful, and concise response.
If you are suggesting ideas, present them in a list.
Your response should be formatted for a chat interface.
`,
});

const assistantChatFlow = ai.defineFlow(
  {
    name: 'assistantChatFlow',
    inputSchema: AssistantChatInputSchema,
    outputSchema: AssistantChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
