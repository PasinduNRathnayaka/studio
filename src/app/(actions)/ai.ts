'use server';

import { applyPortraitMode, ApplyPortraitModeInput } from '@/ai/flows/apply-portrait-mode';
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

export async function applyPortraitEffect(input: ApplyPortraitModeInput) {
  try {
    const result = await applyPortraitMode(input);
    return result;
  } catch (error) {
    console.error('Error applying portrait effect:', error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('Failed to apply portrait effect due to an unknown error.');
  }
}
