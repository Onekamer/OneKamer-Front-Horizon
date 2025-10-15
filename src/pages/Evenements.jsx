
  import React, { useState, useEffect, useCallback } from 'react';
  import { Helmet } from 'react-helmet';
  import { motion, AnimatePresence } from 'framer-motion';
  import { Card, CardContent } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Calendar, MapPin, Clock, Banknote, Share2, ArrowLeft, Ticket, Plus, Loader2, Trash2 } from 'lucide-react';
  import { useToast } from '@/components/ui/use-toast';
  import { useNavigate } from 'react-router-dom';
  import { requireAuth, supabase } from '@/lib/customSupabaseClient';  // ✅ Correction ici
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

    const OuvrirGoogleMaps = ({ latitude, longitude, location }) => {
      const { toast } = useToast();
      const handleOpenMaps = () => {
        if (!latitude || !longitude) {
          toast({ title: 'Erreur', description: 'Coordonnées de carte non disponibles.', variant: 'destructive' });
          return;
        }
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        window.open(url, "_blank");
      };

      return (
        <button
          onClick={handleOpenMaps}
          className="mt-3 bg-[#2BA84A] hover:bg-[#24903f] text-white px-3 py-2 rounded-md text-sm w-full"
        >
          📍 Ouvrir dans Google Maps {location ? `(${location})` : ""}
        </button>
      );
    };


    const EvenementDetail = ({ event, onBack, onDelete }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const navigate = useNavigate();
      const isOwner = user?.id === event.user_id;
      
      const handleShare = async () => {
        const shareData = { title: event.title, text: event.description, url: window.location.href };
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            if (err.name !== 'AbortError') {
              toast({ title: "Erreur de partage", description: err.message, variant: "destructive" });
            }
          }
        } else {
          toast({ title: "Partage non disponible" });
        }
      };

      const getReservationLink = () => {
        if (event.site_web) return event.site_web;
        if (event.telephone) return `tel:${event.telephone}`;
        if (event.email) return `mailto:${event.email}`;
        return null;
      };

      const handleAddToCalendar = () => {
        const startDate = new Date(`${event.date}T${event.time}`);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

        const googleCalendarUrl = new URL("https://www.google.com/calendar/render");
        googleCalendarUrl.searchParams.append("action", "TEMPLATE");
        googleCalendarUrl.searchParams.append("text", event.title);
        googleCalendarUrl.searchParams.append("dates", `${startDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}/${endDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}`);
        googleCalendarUrl.searchParams.append("details", event.description);
        googleCalendarUrl.searchParams.append("location", event.location);

        window.open(googleCalendarUrl, '_blank');
      };
      
      const navigateToProfile = (e) => {
        e.stopPropagation();
        // No navigation if no specific user_id or if it's the generic "un membre"
        if(event.user_id && event.profiles?.username) {
            navigate(`/profil/${event.user_id}`);
        }
      }

      const reservationLink = getReservationLink();

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-[#FDF9F9] to-[#CDE1D5] overflow-y-auto"
        >
          <div className="relative">
             <MediaDisplay bucket="evenements" path={event.media_url} alt={event.title} className="w-full h-64 object-cover" />
             <div className="absolute top-4 left-4 z-20">
              <button onClick={onBack} className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md">
                <ArrowLeft className="h-6 w-6 text-gray-800" />
              </button>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <FavoriteButton contentType="evenement" contentId={event.id} />
                {isOwner && (
                    <Button variant="ghost" size="icon" className="text-red-500 bg-white/80 backdrop-blur-sm rounded-full h-8 w-8" onClick={() => { onDelete(event.id, event.media_url); onBack(); }}>
                    <Trash2 className="h-4 w-4" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleShare} className="bg-white/80 backdrop-blur-sm rounded-full h-8 w-8"><Share2 className="h-4 w-4 text-gray-500" /></Button>
            </div>
          </div>
          <div className="p-4 -mt-8">
            <Card className="shadow-xl rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                    <span className="bg-[#CDE1D5] text-[#2BA84A] text-xs font-semibold px-2.5 py-1 rounded-full">{event.evenements_types?.nom || 'Type'}</span>
                    <h1 className="text-2xl font-bold text-gray-800 mt-2">{event.title}</h1>
                    <p className="text-sm text-gray-500">
                      Organisé par <span className={`font-semibold text-gray-700 ${event.user_id && event.profiles?.username ? 'cursor-pointer hover:underline' : ''}`} onClick={navigateToProfile}>{event.profiles?.username || event.organisateur || 'un membre'}</span>
                    </p>
                </div>
                
                <div className="space-y-3 text-gray-700 border-t pt-4">
                  <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-[#2BA84A]" /> <span>{new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                  <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-[#2BA84A]" /> <span>{event.time}</span></div>
                  <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#2BA84A]" /> <span>{event.location}</span></div>
                  <div className="flex items-center gap-3"><Banknote className="h-5 w-5 text-[#2BA84A]" /> <span className="font-semibold">{formatPrice(event.price, event.devises)}</span></div>
                </div>

                <div>
                  <h2 className="font-semibold text-gray-800 mb-1">Description</h2>
                  <p className="text-gray-600 text-sm">{event.description}</p>
                </div>
                
                <OuvrirGoogleMaps
                  latitude={event.latitude}
                  longitude={event.longitude}
                  location={event.location}
                />

                <div className="flex gap-2 pt-2">
                    {reservationLink ? (
                        <Button asChild className="flex-1 bg-[#E0222A] hover:bg-[#E0222A]/90 text-white"><a href={reservationLink} target="_blank" rel="noopener noreferrer"><Ticket className="h-4 w-4 mr-2" /> Réserver</a></Button>
                    ) : (
                        <Button className="flex-1 bg-[#E0222A]/50 cursor-not-allowed text-white"><Ticket className="h-4 w-4 mr-2" /> Pas de réservation</Button>
                    )}
                    <Button variant="outline" className="flex-1" onClick={handleAddToCalendar}><Calendar className="h-4 w-4 mr-2" /> Ajouter au calendrier</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      );
    };

    const EvenementCard = ({ event, onSelect }) => {
        const { toast } = useToast();
        const handleShare = async (e) => {
            e.stopPropagation();
            if (navigator.share) {
                try {
                    await navigator.share({ title: event.title, text: event.description, url: window.location.href });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        toast({ title: "Erreur de partage", description: err.message, variant: "destructive" });
                    }
                }
            } else {
                toast({ title: "Partage non disponible" });
            }
        };
        
        return (
            <Card onClick={() => onSelect(event)} className="cursor-pointer group overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col rounded-lg">
                <div className="relative h-48 bg-gray-200">
                    <MediaDisplay bucket="evenements" path={event.media_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="relative p-2 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="bg-[#E0222A] text-white px-3 py-1 rounded-full text-xs font-semibold">{event.evenements_types?.nom || 'Catégorie'}</div>
                            <div className="flex items-center gap-2">
                                <FavoriteButton contentType="evenement" contentId={event.id} />
                                <Button variant="ghost" size="icon" onClick={handleShare} className="text-white bg-black/20 hover:bg-black/40 rounded-full h-8 w-8">
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg truncate">{event.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-200"><MapPin className="h-4 w-4" />{event.location}</div>
                        </div>
                    </div>
                </div>
                <CardContent className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="h-4 w-4 text-[#2BA84A]" /><span>{new Date(event.date).toLocaleDateString('fr-FR')} à {event.time}</span></div>
                    </div>
                    <span className="text-2xl font-bold text-[#2BA84A] mt-2">{formatPrice(event.price, event.devises)}</span>
                </CardContent>
            </Card>
        );
    };

const Evenements = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [canCreateEvent, setCanCreateEvent] = useState(false);

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
      canUserAccess(user, "evenements", "create").then(setCanCreateEvent);
    } else {
      setCanCreateEvent(false);
    }
  }, [user]);


      const fetchEvents = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('view_evenements_accessible').select('*, evenements_types(nom), profiles(username), devises(symbole)').order('date', { ascending: true });
        if (error) {
          console.error("Error fetching events:", error);
          toast({ title: 'Erreur', description: "Impossible de charger les événements.", variant: 'destructive' });
        } else {
          setEvents(data);
        }
        setLoading(false);
      }, [toast]);
      
      useEffect(() => {
        fetchEvents();
        
        const channel = supabase.channel('public:evenements')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'evenements' }, fetchEvents)
          .subscribe();
          
        return () => supabase.removeChannel(channel);
      }, [fetchEvents]);
      
      const handleDelete = async (eventId, mediaUrl) => {
        if (!user) return;
        try {
          if (mediaUrl) await supabase.storage.from('evenements').remove([mediaUrl]);
          const { error } = await supabase.from('evenements').delete().eq('id', eventId);
          if (error) throw error;
          toast({ title: 'Succès', description: 'Événement supprimé.' });
        } catch (error) {
          toast({ title: "Erreur de suppression", description: error.message, variant: "destructive" });
        }
      };

      const handleCreateClick = async () => {
        if (!user) {
          toast({title: "Connexion requise", description: "Veuillez vous connecter pour créer un événement.", variant: "destructive"});
          return;
        }
        if (canCreateEvent) {
          navigate('/publier/evenement');
        } else {
          const allowed = await canUserAccess(user, 'evenements', 'create');
          if (allowed) {
            navigate('/publier/evenement');
          } else {
            toast({title: "Accès restreint", description: "Passez VIP pour créer un événement.", variant: "destructive"});
            navigate('/forfaits');
          }
        }
      };

      return (
        <>
          <Helmet>
            <title>Événements - OneKamer.co</title>
            <meta name="description" content="Découvrez les événements de la communauté OneKamer.co" />
          </Helmet>

          <AnimatePresence>
            {selectedEvent && <EvenementDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} onDelete={handleDelete} />}
          </AnimatePresence>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-[#2BA84A]">Événements</h1>
                {canCreateEvent && (
                  <Button onClick={handleCreateClick} className="bg-gradient-to-r from-[#2BA84A] to-[#F5C300] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Créer
                  </Button>
                )}
              </div>
            </motion.div>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#2BA84A]" /></div> :
            events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event, index) => (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <EvenementCard event={event} onSelect={setSelectedEvent} />
                  </motion.div>
                ))}
              </div>
            ) : (
                 <div className="text-center py-12 text-gray-500">
                    <p>Aucun événement pour le moment.</p>
                </div>
            )}
          </div>
        </>
      );
    };

    export default Evenements;
