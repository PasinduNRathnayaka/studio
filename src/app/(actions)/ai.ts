'use server';

import { suggestCinematicEdits, SuggestCinematicEditsInput } from '@/ai/flows/suggest-cinematic-edits';

export async function getCinematicSuggestions(input: SuggestCinematicEditsInput) {
  try {
    const result = await suggestCinematicEdits(input);
    return result;
  } catch (error) {
    console.error('Error getting cinematic suggestions:', error);
    // Return a valid structure on error to prevent client-side crashes
    return { suggestedEdits: [] };
  }
}
