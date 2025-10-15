
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Phone, Mail, ArrowLeft, Plus, Loader2, Trash2, Star, MessageSquare, Share2, Lock, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { requireAuth, supabase } from '@/lib/customSupabaseClient';  // ✅ Correction ici
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MediaDisplay from '@/components/MediaDisplay';
import FavoriteButton from '@/components/FavoriteButton';
import { canUserAccess } from '@/lib/accessControl';


const PartenaireDetail = ({ partenaire, onBack, onRecommander }) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: partenaire.name,
        text: `Découvrez ${partenaire.name} sur OneKamer.co !`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert("La fonction de partage n'est pas supportée sur ce navigateur.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-[#FDF9F9] to-[#CDE1D5] overflow-y-auto pt-16 pb-16"
    >
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <Card className="shadow-xl rounded-2xl">
          {partenaire.media_url && (
            <MediaDisplay bucket="partenaires" path={partenaire.media_url} alt={partenaire.name} className="w-full h-48 object-cover rounded-t-2xl" />
          )}
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl font-bold text-gray-800">{partenaire.name}</CardTitle>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full">{partenaire.partenaires_categories?.nom || 'Partenaire'}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{partenaire.description}</p>
            <div className="text-sm text-gray-500 space-y-2">
              <p><span className="font-semibold">Adresse:</span> {partenaire.address}</p>
              <p><span className="font-semibold">Téléphone:</span> <a href={`tel:${partenaire.phone}`} className="text-green-600">{partenaire.phone}</a></p>
              {partenaire.website && <p><span className="font-semibold">Site web:</span> <a href={partenaire.website} target="_blank" rel="noopener noreferrer" className="text-green-600">{partenaire.website}</a></p>}
            </div>
            <p className="text-sm text-gray-500 italic border-t pt-4">Recommandé par: {partenaire.recommandation || 'la communauté'}</p>
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => onRecommander(partenaire.id)} className="flex-1">
                <Star className="w-4 h-4 mr-2" /> Recommander
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" /> Partager
              </Button>
            </div>
            <div className="flex gap-2">
              {partenaire.phone && (
                <a href={`sms:${partenaire.phone}`} className="flex-1">
                  <Button variant="secondary" className="w-full"><MessageSquare className="w-4 h-4 mr-2" /> Contacter par SMS</Button>
                </a>
              )}
              {partenaire.email && (
                <a href={`mailto:${partenaire.email}`} className="flex-1">
                  <Button variant="secondary" className="w-full"><Mail className="w-4 h-4 mr-2" /> Contacter par Email</Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

const Partenaires = () => {
  const [partenaires, setPartenaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartenaire, setSelectedPartenaire] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await requireAuth(navigate);
      } catch {
        return;
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      canUserAccess(user, 'partenaires', 'create').then(setCanCreate);
    }
  }, [user]);


  const fetchPartenaires = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('view_partenaires_accessible').select('*, partenaires_categories(id, nom)');
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les partenaires.' });
      console.error(error);
    } else {
      setPartenaires(data);
    }
    setLoading(false);
  }, [searchTerm, toast]);

  useEffect(() => {
    fetchPartenaires();
  }, [fetchPartenaires]);

  const handleProposerClick = async () => {
    if (!user) {
        toast({
            title: "Connexion requise",
            variant: "destructive",
        });
        navigate("/auth");
        return;
    }
    if (await canUserAccess(user, 'partenaires', 'create')) {
      navigate('/publier/partenaire');
    } else {
      toast({
        title: "Accès restreint",
        description: "Cette fonctionnalité est réservée aux membres VIP.",
        variant: "destructive",
      });
      navigate("/forfaits");
    }
  };

  const handleRecommander = (partenaireId) => {
    toast({ title: 'Bientôt disponible', description: 'La fonctionnalité de recommandation sera bientôt activée.' });
  };

  return (
    <>
      <Helmet>
        <title>Partenaires - OneKamer.co</title>
        <meta name="description" content="Découvrez les partenaires de confiance de la communauté OneKamer." />
      </Helmet>

      <AnimatePresence>
        {selectedPartenaire && (
          <PartenaireDetail 
            partenaire={selectedPartenaire} 
            onBack={() => setSelectedPartenaire(null)} 
            onRecommander={handleRecommander}
          />
        )}
      </AnimatePresence>
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-[#2BA84A]"
          >
            Partenaires
          </motion.h1>
          <Button onClick={handleProposerClick} disabled={!canCreate}>
            {canCreate ? <Plus className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            {canCreate ? 'Proposer' : 'Verrouillé'}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Rechercher un partenaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partenaires.map((partenaire, index) => (
              <motion.div
                key={partenaire.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedPartenaire(partenaire)}
                className="cursor-pointer"
              >
                <Card className="relative overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col group">
                  {partenaire.media_url ? (
                    <div className="h-40 w-full relative">
                      <MediaDisplay bucket="partenaires" path={partenaire.media_url} alt={partenaire.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                        {partenaire.partenaires_categories?.nom || 'Général'}
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <FavoriteButton contentType="partenaire" contentId={partenaire.id} className="text-white hover:text-yellow-400" />
                        <Button variant="ghost" size="icon" className="text-white hover:text-blue-400">
                          <Share2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400 relative">
                      <span>Pas d'image</span>
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                        {partenaire.partenaires_categories?.nom || 'Général'}
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <FavoriteButton contentType="partenaire" contentId={partenaire.id} className="text-white hover:text-yellow-400" />
                        <Button variant="ghost" size="icon" className="text-white hover:text-blue-400">
                          <Share2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg font-semibold">{partenaire.name}</CardTitle>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M12 18.7c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/><circle cx="12" cy="12" r="2"/><path d="M12 22s-8-4-8-10c0-4.4 3.6-8 8-8s8 3.6 8 8c0 6-8 10-8 10z"/></svg>
                      {partenaire.address}
                    </p>
                  </CardHeader>
                  <CardContent className="flex justify-around border-t pt-4 pb-0">
                    <Button variant="ghost" size="icon">
                      <MessageSquare className="w-5 h-5 text-[#2BA84A]" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Mail className="w-5 h-5 text-[#2BA84A]" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Partenaires;
