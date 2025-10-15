import { supabase } from '@/lib/customSupabaseClient';

/**
 * Retrieves the user ID from Supabase based on an input which can be a username, email, or UUID.
 * Search for username and email is case-insensitive.
 * @param {string} input - The username, email, or UUID of the user.
 * @returns {Promise<string>} - The user's UUID.
 * @throws {Error} - If the user is not found.
 */
export async function getUserIdByInput(input) {
  if (!input) {
    throw new Error('Le champ destinataire ne peut pas être vide.');
  }

  const trimmedInput = input.trim();

  // Regex to check for UUID format
  const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmedInput);

  let query = supabase.from('profiles').select('id').limit(1);

  if (trimmedInput.includes('@')) {
    query = query.ilike('email', trimmedInput);
  } else if (isUUID) {
    query = query.eq('id', trimmedInput);
  } else {
    // Case-insensitive search for username
    query = query.ilike('username', trimmedInput);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new Error('Aucun utilisateur trouvé avec ce pseudo ou cet email.');
  }

  return data.id;
}