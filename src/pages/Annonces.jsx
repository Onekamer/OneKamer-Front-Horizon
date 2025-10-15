
import React, { useState, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Card, CardContent } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Search, Share2, MapPin, ArrowLeft, Phone, MessageSquare, Mail, Plus, Loader2, Trash2, Euro } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import { useNavigate } from 'react-router-dom';
    import { requireAuth, supabase } from '@/lib/customSupabaseClient'
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import MediaDisplay from '@/components/MediaDisplay';
    import FavoriteButton from '@/components/FavoriteButton';
    import { canUserAccess } from '@/lib/accessControl';

    const formatPrice = (price, devise) => {
        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber) || priceNumber <= 0) {
            return 'Gratuit';
        }
        const symbol = devise?.symbole || '€';
        return `${priceNumber.toFixed(2).replace('.', ',')} ${symbol}`;
    };

    const AnnonceDetail = ({ annonce, onBack, onDelete }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const navigate = useNavigate();
      const isOwner = user?.id === annonce.user_id;

      const handleShare = async () => {
        const shareData = {
          title: annonce.titre,
          text: annonce.description,
          url: window.location.href,
        };
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            if (err.name !== 'AbortError') {
              toast({ title: "Erreur de partage", description: err.message, variant: "destructive" });
            }
          }
        } else {
          toast({ title: "Partage non disponible", description: "Votre navigateur ne supporte pas le partage natif." });
        }
      };

      const navigateToProfile = (e) => {
        e.stopPropagation();
        if(annonce.user_id) {
            navigate(`/profil/${annonce.user_id}`);
        }
      }

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-[#FDF9F9] to-[#CDE1D5] overflow-y-auto"
        >
          <div className="relative">
            <MediaDisplay bucket="annonces" path={annonce.media_url} alt={annonce.titre} className="w-full h-64 object-cover" />
            <div className="absolute top-4 left-4 z-20">
              <button onClick={onBack} className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md">
                <ArrowLeft className="h-6 w-6 text-gray-800" />
              </button>
            </div>
             <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <FavoriteButton contentType="annonce" contentId={annonce.id} />
                {isOwner && (
                  <Button variant="ghost" size="icon" className="text-red-500 bg-white/80 backdrop-blur-sm rounded-full h-8 w-8" onClick={() => {onDelete(annonce.id, annonce.media_url); onBack();}}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleShare} className="bg-white/80 backdrop-blur-sm rounded-full h-8 w-8"><Share2 className="h-4 w-4 text-gray-500" /></Button>
            </div>
          </div>
          <div className="p-4 -mt-8">
            <Card className="shadow-xl rounded-2xl relative">
              <CardContent className="p-6 space-y-4 pt-6">
                
                <div className="space-y-1">
                    <span className="bg-[#CDE1D5] text-[#2BA84A] text-xs font-semibold px-2.5 py-1 rounded-full">{annonce.annonces_categories?.nom || 'Catégorie'}</span>
                    <h1 className="text-2xl font-bold text-gray-800 pt-2">{annonce.titre}</h1>
                    <p className="text-sm text-gray-500">
                      par <span className="font-semibold text-gray-700 cursor-pointer hover:underline" onClick={navigateToProfile}>{annonce.profiles?.username || 'un membre'}</span>
                    </p>
                </div>
                
                <div>
                  <p className="text-3xl font-bold text-[#2BA84A]">{formatPrice(annonce.prix, annonce.devises)}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{annonce.villes?.nom}, {annonce.pays?.nom}</span>
                  </div>
                </div>

                <div>
                  <h2 className="font-semibold text-gray-800 mb-1">Description</h2>
                  <p className="text-gray-600 text-sm">{annonce.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  {annonce.telephone && (
                    <a href={`tel:${annonce.telephone}`} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="flex items-center gap-2 w-full">
                        <Phone className="h-4 w-4" /> Appeler
                      </Button>
                    </a>
                  )}
                  {annonce.telephone && (
                    <a href={`https://wa.me/${annonce.telephone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button className="flex items-center gap-2 w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                        <MessageSquare className="h-4 w-4" /> WhatsApp
                      </Button>
                    </a>
                  )}
                  {annonce.email && (
                    <a href={`mailto:${annonce.email}`} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="flex items-center gap-2 w-full">
                        <Mail className="h-4 w-4" /> Email
                      </Button>
                    </a>
                  )}
                </div>
                
                <p className="text-center text-xs text-gray-400 pt-2">Publié le {new Date(annonce.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      );
    };

    const AnnonceCard = ({ annonce, onSelect }) => {
        const { toast } = useToast();
        const handleShare = async (e) => {
            e.stopPropagation();
            const shareData = { title: annonce.titre, text: annonce.description, url: window.location.href };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                   if (err.name !== 'AbortError') {
                     toast({ title: "Erreur de partage", description: err.message, variant: "destructive" });
                   }
                }
            } else {
                toast({ title: "Partage non disponible", description: "Votre navigateur ne supporte pas le partage natif." });
            }
        };

        return (
            <Card onClick={() => onSelect(annonce)} className="cursor-pointer group overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col rounded-lg">
                <div className="relative h-48 bg-gray-200">
                    <MediaDisplay bucket="annonces" path={annonce.media_url} alt={annonce.titre} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="relative p-2 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="bg-[#E0222A] text-white px-3 py-1 rounded-full text-xs font-semibold">{annonce.annonces_categories?.nom || 'Catégorie'}</div>
                            <div className="flex items-center gap-2">
                                <FavoriteButton contentType="annonce" contentId={annonce.id} />
                                <Button variant="ghost" size="icon" onClick={handleShare} className="text-white bg-black/20 hover:bg-black/40 rounded-full h-8 w-8">
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg truncate">{annonce.titre}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-200"><MapPin className="h-4 w-4" />{annonce.villes?.nom || 'Lieu non spécifié'}</div>
                        </div>
                    </div>
                </div>
                <CardContent className="p-4 flex-grow flex flex-col justify-between">
                    <span className="text-2xl font-bold text-[#2BA84A] mb-2">{formatPrice(annonce.prix, annonce.devises)}</span>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {annonce.telephone && (
                        <a href={`https://wa.me/${annonce.telephone.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="w-full bg-[#25D366]/10 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/20">
                              <MessageSquare className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {annonce.email && (
                        <a href={`mailto:${annonce.email}`} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="w-full">
                              <Mail className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                </CardContent>
            </Card>
        );
    };


const Annonces = () => {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [canCreateAd, setCanCreateAd] = useState(false);

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
      canUserAccess(user, "annonces", "create").then(setCanCreateAd);
    } else {
      setCanCreateAd(false);
    }
  }, [user]);


      const fetchAnnonces = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('view_annonces_accessible')
          .select('*, annonces_categories(nom), pays(nom), villes(nom), profiles(username, avatar_url), devises(symbole)')
          .order('created_at', { ascending: false });

        if (error) {
          toast({ title: "Erreur de chargement", description: error.message, variant: "destructive" });
          setAnnonces([]);
        } else {
          setAnnonces(data);
        }
        setLoading(false);
      }, [toast]);

      useEffect(() => {
        fetchAnnonces();

        const channel = supabase.channel('realtime:public:annonces')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'annonces' }, (payload) => {
            fetchAnnonces();
          })
          .subscribe();
        
        return () => {
          supabase.removeChannel(channel);
        }
      }, [fetchAnnonces]);

      const handleDelete = async (annonceId, mediaPath) => {
        if (!user) return;
        try {
          if (mediaPath) {
            const { error: storageError } = await supabase.storage.from('annonces').remove([mediaPath]);
            if (storageError) console.warn("Storage deletion warning:", storageError.message);
          }

          const { error: dbError } = await supabase.from('annonces').delete().eq('id', annonceId);
          if (dbError) throw dbError;
          
          toast({ title: 'Succès', description: 'Annonce supprimée.' });
        } catch (error) {
          toast({ title: "Erreur de suppression", description: error.message, variant: "destructive" });
        }
      };

      const handleCreateClick = async () => {
        if (!user) {
          toast({title: "Connexion requise", description: "Veuillez vous connecter pour publier.", variant: "destructive"});
          return;
        }
        if (canCreateAd) {
          navigate('/publier/annonce');
        } else {
          const allowed = await canUserAccess(user, 'annonces', 'create');
          if (allowed) {
            navigate('/publier/annonce');
          } else {
            toast({title: "Accès restreint", description: "Passez VIP pour créer une annonce.", variant: "destructive"});
            navigate('/forfaits');
          }
        }
      }

      const filteredAnnonces = annonces.filter(annonce => 
        (annonce.titre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (annonce.annonces_categories?.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (annonce.villes?.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );

      return (
        <>
          <Helmet>
            <title>Annonces - OneKamer.co</title>
            <meta name="description" content="Découvrez les annonces de la communauté OneKamer.co" />
          </Helmet>

          <AnimatePresence>
            {selectedAnnonce && (
              <AnnonceDetail 
                annonce={selectedAnnonce} 
                onBack={() => setSelectedAnnonce(null)} 
                onDelete={handleDelete}
              />
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-[#2BA84A]">Annonces</h1>
                {canCreateAd && 
                  <Button onClick={handleCreateClick} className="bg-gradient-to-r from-[#E0222A] to-[#F5C300] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Créer
                  </Button>
                }
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B6B6B]" />
                <Input placeholder="Rechercher une annonce..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#2BA84A]" /></div>
            ) : filteredAnnonces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAnnonces.map((annonce, index) => (
                  <motion.div key={annonce.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                     <AnnonceCard annonce={annonce} onSelect={setSelectedAnnonce} />
                  </motion.div>
                ))}
              </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <p>Aucune annonce pour le moment.</p>
                    <p>Soyez le premier à en publier une !</p>
                </div>
            )}
          </div>
        </>
      );
    };

    export default Annonces;
