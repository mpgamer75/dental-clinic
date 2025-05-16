import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Export AI instance with basic configuration
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
