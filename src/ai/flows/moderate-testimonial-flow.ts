'use server';
/**
 * @fileOverview A testimonial content moderation AI flow.
 *
 * - moderateTestimonial - A function that handles testimonial content moderation.
 * - ModerateTestimonialInput - The input type for the moderateTestimonial function.
 * - ModerateTestimonialOutput - The return type for the moderateTestimonial function.
 */

import {ai} from '@/ai/genkits';
import {z} from 'genkit';

const ModerateTestimonialInputSchema = z.object({
  quote: z.string().describe('The testimonial text to be moderated.'),
});
export type ModerateTestimonialInput = z.infer<typeof ModerateTestimonialInputSchema>;

const ModerateTestimonialOutputSchema = z.object({
  isAppropriate: z.boolean().describe('Whether the content is appropriate or not.'),
  reason: z.string().optional().describe('The reason why the content is not appropriate, if applicable.'),
});
export type ModerateTestimonialOutput = z.infer<typeof ModerateTestimonialOutputSchema>;

export async function moderateTestimonial(input: ModerateTestimonialInput): Promise<ModerateTestimonialOutput> {
  return moderateTestimonialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateTestimonialPrompt',
  input: {schema: ModerateTestimonialInputSchema},
  output: {schema: ModerateTestimonialOutputSchema},
  prompt: `You are a content moderation expert. Analyze the following testimonial text for any profanity, hate speech, excessively negative sentiment, or generally inappropriate content for a clinic's website.

Respond with whether the content is appropriate or not. If it's not appropriate, briefly explain why.

Text to analyze:
"{{{quote}}}"

Your response must be in JSON format.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
       {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
       {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE', // Allow some edgy but not harmful content
      },
    ],
  }
});

const moderateTestimonialFlow = ai.defineFlow(
  {
    name: 'moderateTestimonialFlow',
    inputSchema: ModerateTestimonialInputSchema,
    outputSchema: ModerateTestimonialOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        // Handle cases where the LLM might not return valid JSON or any output
        // This could be due to safety settings blocking the prompt itself, or other issues.
        return {
            isAppropriate: false,
            reason: 'Content moderation failed or content was blocked by safety filters.',
        };
    }
    return output;
  }
);
