import { supabase } from '@/lib/customSupabaseClient';

export async function canUserAccess(user, section, action = "read") {
  if (!user?.id) {
    console.warn("⚠️ Aucun utilisateur connecté, accès refusé.");
    return false;
  }

  try {
    // 1️⃣ Récupération du plan depuis la table profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error("❌ Erreur chargement profil :", profileError?.message);
      return false;
    }

    const plan = (profile.plan || 'free').toLowerCase();
    console.log(`🔍 [canUserAccess] Utilisateur ${user.id} | Plan = ${plan} | Section = ${section} | Action = ${action}`);

    // 2️⃣ Cas spécial : section "rencontre"
    if (section === 'rencontre') {
      if (['view', 'create'].includes(action)) {
        console.log(`✅ Accès autorisé → Tous les plans peuvent ${action} la section Rencontre.`);
        return true;
      }

      if (action === 'interact') {
        const allowed = ['vip', 'admin'].includes(plan);
        console.log(allowed 
          ? "✅ Accès autorisé → VIP/Admin peuvent interagir."
          : "⛔ Accès refusé → Interactions réservées aux VIP/Admin.");
        return allowed;
      }
    }

    // 3️⃣ Autres sections : vérification via Supabase
    console.log(`🧠 Vérification via Supabase RPC check_user_access(${section}, ${action})...`);
    const { data, error } = await supabase.rpc("check_user_access", {
      p_user_id: user.id,
      p_section: section,
      p_action: action
    });

    if (error) {
      console.error("❌ Erreur RPC check_user_access:", error.message);
      return false;
    }

    console.log(`✅ Résultat Supabase :`, data);
    return data === true;
  } catch (error) {
    console.error("💥 Erreur inattendue dans canUserAccess :", error.message);
    return false;
  }
}
