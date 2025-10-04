'use server';

/**
 * @fileoverview This file initializes the Genkit AI singleton and configures it with the Google AI plugin.
 * It ensures that the GEMINI_API_KEY is properly loaded from the environment variables.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { defineDotprompt } from 'genkit/dotprompt';
import * as z from 'zod';
import 'dotenv/config';

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    'GEMINI_API_KEY environment variable not set. Please create a .env file and add it.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { googleAI };
