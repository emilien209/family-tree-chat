
'use server';
/**
 * @fileoverview An AI assistant for the Family Tree Chat application.
 *
 * - askAssistant - A function that handles conversation with the AI assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AssistantInputSchema = z.object({
  history: z.array(z.any()).optional(),
  prompt: z.string(),
});
type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  response: z.string(),
});
type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

const assistantPrompt = ai.definePrompt(
    {
      name: 'assistantPrompt',
      input: { schema: AssistantInputSchema },
      output: { schema: AssistantOutputSchema },
      prompt: `You are a helpful AI assistant for an application called "Family Tree Chat".

Your role is to answer user questions about the application's features and how to use them.

Be friendly, concise, and clear in your responses.

Here is the conversation history with the user:
{{#each history}}
- {{role}}: {{#each content}}{{#if text}}{{text}}{{/if}}{{/each}}
{{/each}}

Here is the user's latest question:
{{prompt}}

Provide a direct response to the user's question.`,
    },
  );
  

const assistantChatFlow = ai.defineFlow(
  {
    name: 'assistantChatFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const llmResponse = await assistantPrompt(input);
    return llmResponse.output!;
  }
);

export async function askAssistant(
  input: AssistantInput
): Promise<AssistantOutput> {
  return assistantChatFlow(input);
}
