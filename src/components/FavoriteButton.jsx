import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const FavoriteButton = ({ contentType, contentId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavori, setIsFavori] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkFavorite = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favoris')
        .select('id')
        .eq('user_id', user.id)
        .eq('type_contenu', contentType)
        .eq('content_id', contentId)
        .maybeSingle();

      if (error) throw error;
      
      setIsFavori(!!data);
    } catch (error) {
      console.error("Erreur lors de la vérification du favori:", error.message);
    } finally {
      setLoading(false);
    }
  }, [user, contentType, contentId]);

  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  const handleToggleFavori = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour ajouter des favoris.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('toggle_favori', {
        p_user_id: user.id,
        p_content_id: contentId, // Changé de p_contenu_id à p_content_id
        p_type_contenu: contentType,
      });

      if (error) throw error;

      if (data.action === 'added') {
        setIsFavori(true);
        toast({ title: 'Ajouté aux favoris !', description: 'Retrouvez-le dans votre compte.' });
      } else {
        setIsFavori(false);
        toast({ title: 'Retiré des favoris' });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      checkFavorite();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div whileTap={{ scale: 1.2, rotate: 15 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
      <Button variant="ghost" size="icon" onClick={handleToggleFavori} disabled={loading} className="text-white bg-black/20 hover:bg-black/40 rounded-full h-8 w-8">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Star
            className={`h-4 w-4 ${isFavori ? 'text-yellow-400' : 'text-white'}`}
            fill={isFavori ? 'currentColor' : 'none'}
          />
        )}
      </Button>
    </motion.div>
  );
};

export default FavoriteButton;