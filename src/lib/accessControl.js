import { supabase } from '@/lib/customSupabaseClient';

// ✅ Nouvelle version : utilise la bonne fonction RPC user_has_feature
export async function canUserAccess(user, featureKey) {
  if (!user?.id) return false;
  try {
    const { data, error } = await supabase.rpc('user_has_feature', {
      p_feature_key: featureKey,
      p_user_id: user.id,
    });

    if (error) {
      console.error('Erreur user_has_feature:', error.message);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Erreur RPC user_has_feature:', error.message);
    return false;
  }
}

