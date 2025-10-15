
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useCharteValidation = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [showCharte, setShowCharte] = useState(false);

  useEffect(() => {
    if (!loading && user && profile && !profile.has_accepted_charte) {
      setShowCharte(true);
    } else {
      setShowCharte(false);
    }
  }, [user, profile, loading]);

  const acceptCharte = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        has_accepted_charte: true,
        charte_accepted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accepter la charte. Veuillez réessayer.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Charte acceptée !",
        description: "Bienvenue dans la communauté OneKamer.co !",
      });
      await refreshProfile();
      setShowCharte(false);
    }
  }, [user, toast, refreshProfile]);

  return { showCharte, acceptCharte };
};
