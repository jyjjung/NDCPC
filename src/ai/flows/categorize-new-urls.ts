
'use server';

/**
 * @fileOverview A flow that uses AI to categorize newly added URLs.
 *
 * - categorizeUrl - A function that takes a URL and returns a suggested category.
 * - CategorizeUrlInput - The input type for the categorizeUrl function.
 * - CategorizeUrlOutput - The return type for the categorizeUrl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeUrlInputSchema = z.object({
  url: z.string().describe('The URL to categorize.'),
});
export type CategorizeUrlInput = z.infer<typeof CategorizeUrlInputSchema>;

const CategorizeUrlOutputSchema = z.object({
  category: z.string().describe('The suggested category for the URL.'),
});
export type CategorizeUrlOutput = z.infer<typeof CategorizeUrlOutputSchema>;

export async function categorizeUrl(input: CategorizeUrlInput): Promise<CategorizeUrlOutput> {
  return categorizeUrlFlow(input);
}

const categorizeUrlPrompt = ai.definePrompt({
  name: 'categorizeUrlPrompt',
  input: {schema: CategorizeUrlInputSchema},
  output: {schema: CategorizeUrlOutputSchema},
  prompt: `You are an expert in categorizing URLs for a preschooler's church.
  Given the following URL, suggest a category for it.  The category should be one of:
  chants, songs.

  URL: {{{url}}}
  Category:`,
});

const categorizeUrlFlow = ai.defineFlow(
  {
    name: 'categorizeUrlFlow',
    inputSchema: CategorizeUrlInputSchema,
    outputSchema: CategorizeUrlOutputSchema,
  },
  async input => {
    const {output} = await categorizeUrlPrompt(input);
    return output!;
  }
);
