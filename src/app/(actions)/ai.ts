'use server';

import { suggestCinematicEdits, SuggestCinematicEditsInput } from '@/ai/flows/suggest-cinematic-edits';
import { applyPortraitMode, type ApplyPortraitModeInput } from '@/ai/flows/apply-portrait-mode';

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

export async function applyPortraitModeAction(input: ApplyPortraitModeInput) {
  try {
    const result = await applyPortraitMode(input);
    return result;
  } catch (error) {
    console.error('Error applying portrait mode:', error);
    // Let the client handle the error
    throw new Error('Failed to apply portrait mode effect.');
  }
}
