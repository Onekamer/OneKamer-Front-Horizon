
import { supabase } from '@/lib/customSupabaseClient';

export async function canUserAccess(user, section, action = "read") {
  if (!user?.id) return false;
  try {
    const { data, error } = await supabase.rpc("check_user_access", {
      p_user_id: user.id,
      p_section: section,
      p_action: action
    });
    if (error) {
      console.error("Erreur check_user_access:", error.message);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("Erreur RPC check_user_access:", error.message);
    return false;
  }
}

