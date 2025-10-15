import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Star, ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import MediaDisplay from '@/components/MediaDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FavoriteItemCard = ({ item, type, onRemove }) => {
  const navigate = useNavigate();

  const getDetails = () => {
    switch (type) {
      case 'annonce':
        return {
          title: item.titre,
          image: item.media_url,
          bucket: 'annonces',
          path: `/annonces`
        };
      case 'partenaire':
        return {
          title: item.name,
          image: item.media_url,
          bucket: 'partenaires',
          path: `/partenaires`
        };
      case 'evenement':
        return {
          title: item.title,
          image: item.media_url,
          bucket: 'evenements',
          path: `/evenements`
        };
      case 'fait_divers':
        return {
          title: item.title,
          image: item.image_url,
          bucket: 'faits_divers',
          path: `/faits-divers`
        };
      default:
        return { title: 'Contenu inconnu' };
    }
  };

  const details = getDetails();

  return (
    <Card className="overflow-hidden w-full">
      <div className="flex">
        <div className="w-1/3 flex-shrink-0">
          <MediaDisplay bucket={details.bucket} path={details.image} alt={details.title} className="w-full h-24 object-cover" />
        </div>
        <div className="w-2/3 p-3 flex flex-col justify-between">
          <div>
            <p className="font-semibold text-sm truncate">{details.title}</p>
            <p className="text-xs text-gray-500 capitalize">{type.replace('_', ' ')}</p>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button size="sm" variant="ghost" onClick={() => onRemove(item.id, type)}>
              <Trash2 className="h-4 w-4 text-red-500"/>
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(details.path)}>Voir</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};


const Favoris = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: favorisData, error: favorisError } = await supabase
      .from('favoris')
      .select('*')
      .eq('user_id', user.id);

    if (favorisError) {
      toast({ title: "Erreur", description: favorisError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const grouped = favorisData.reduce((acc, fav) => {
      if (!acc[fav.type_contenu]) {
        acc[fav.type_contenu] = [];
      }
      acc[fav.type_contenu].push(fav);
      return acc;
    }, {});

    const allFavoritesDetails = {};

    for (const type in grouped) {
      const ids = grouped[type].map(fav => fav.content_id);
      const tableName = type === 'fait_divers' ? 'faits_divers' : `${type}s`;
      const { data: details, error: detailsError } = await supabase
        .from(tableName)
        .select('*')
        .in('id', ids);

      if (detailsError) {
        console.error(`Erreur pour ${type}:`, detailsError.message);
        continue;
      }
      
      allFavoritesDetails[type] = details.map(detail => ({
        ...detail,
        favori_id: grouped[type].find(fav => fav.content_id === detail.id).id
      }));
    }

    setFavorites(allFavoritesDetails);
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (contentId, contentType) => {
    if (!user) return;
    try {
        const { error } = await supabase.rpc('toggle_favori', {
            p_user_id: user.id,
            p_content_id: contentId, // Changé de p_contenu_id à p_content_id
            p_type_contenu: contentType,
        });

        if (error) throw error;
        toast({ title: 'Favori retiré' });
        fetchFavorites();
    } catch (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const favoriteTypes = Object.keys(favorites).filter(type => favorites[type]?.length > 0);

  return (
    <>
      <Helmet>
        <title>Mes Favoris - OneKamer.co</title>
        <meta name="description" content="Retrouvez tous vos contenus favoris sur OneKamer.co." />
      </Helmet>
       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
         <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/compte')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold text-[#2BA84A]">Mes Favoris</h1>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#2BA84A]" /></div>
        ) : favoriteTypes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="font-semibold">Aucun favori pour le moment.</p>
            <p className="text-sm">Parcourez le site et ajoutez des contenus à vos favoris !</p>
          </div>
        ) : (
          <Tabs defaultValue={favoriteTypes[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {favoriteTypes.includes('annonce') && <TabsTrigger value="annonce">Annonces</TabsTrigger>}
              {favoriteTypes.includes('partenaire') && <TabsTrigger value="partenaire">Partenaires</TabsTrigger>}
              {favoriteTypes.includes('evenement') && <TabsTrigger value="evenement">Événements</TabsTrigger>}
              {favoriteTypes.includes('fait_divers') && <TabsTrigger value="fait_divers">Faits Divers</TabsTrigger>}
            </TabsList>
            {Object.entries(favorites).map(([type, items]) => (
              items.length > 0 && (
                <TabsContent key={type} value={type}>
                  <div className="space-y-4 mt-4">
                    {items.map(item => (
                      <FavoriteItemCard key={item.id} item={item} type={type} onRemove={handleRemoveFavorite} />
                    ))}
                  </div>
                </TabsContent>
              )
            ))}
          </Tabs>
        )}
      </motion.div>
    </>
  );
};

export default Favoris;