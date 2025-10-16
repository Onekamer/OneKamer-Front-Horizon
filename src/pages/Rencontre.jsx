
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, X, MapPin, Eye, ArrowLeft, Briefcase, User, Ruler, Weight, Users, Film, Tv, BookOpen, Music, Cigarette, GlassWater, Baby, Paintbrush, Gem, Mail, SlidersHorizontal, Loader2, UserCircle2, Sparkles, Languages, Code, Award, GraduationCap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import MediaDisplay from '@/components/MediaDisplay';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Slider } from "@/components/ui/slider"
import RencontreProfil from './rencontre/RencontreProfil';
import { canUserAccess } from '@/lib/accessControl';


const FiltersDialog = ({ filters, setFilters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [rencontreTypes, setRencontreTypes] = useState([]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  const fetchInitialData = useCallback(async () => {
    const [countriesRes, typesRes] = await Promise.all([
      supabase.from('pays').select('*').order('nom'),
      supabase.from('rencontres_types').select('*').order('nom')
    ]);
    setCountries(countriesRes.data || []);
    setRencontreTypes(typesRes.data || []);
  }, []);

  const fetchCities = useCallback(async (countryId) => {
    if (!countryId) {
      setCities([]);
      return;
    };
    const { data } = await supabase.from('villes').select('*').eq('pays_id', countryId).order('nom');
    setCities(data || []);
  }, []);
  
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (localFilters.countryId) {
      fetchCities(localFilters.countryId);
    }
  }, [localFilters.countryId, fetchCities]);


  const handleApply = () => {
    setFilters(localFilters);
    onApply();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Filtrer les profils</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label>Type de rencontre</Label>
          <select value={localFilters.rencontreTypeId} onChange={e => setLocalFilters({...localFilters, rencontreTypeId: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Tous les types</option>
            {rencontreTypes.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
          </select>
        </div>
        <div>
          <Label>Sexe</Label>
          <select value={localFilters.sexe} onChange={e => setLocalFilters({...localFilters, sexe: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="all">Tous</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>
        </div>
        <div>
          <Label>Pays</Label>
           <select value={localFilters.countryId} onChange={e => setLocalFilters({...localFilters, countryId: e.target.value, cityId: ''})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Tous les pays</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <Label>Ville</Label>
          <select value={localFilters.cityId} disabled={!localFilters.countryId || cities.length === 0} onChange={e => setLocalFilters({...localFilters, cityId: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Toutes les villes</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <Label>Tranche d'âge: {localFilters.ageRange[0]} - {localFilters.ageRange[1]} ans</Label>
          <Slider
            defaultValue={localFilters.ageRange}
            onValueChange={value => setLocalFilters(prev => ({ ...prev, ageRange: value }))}
            max={65}
            min={18}
            step={1}
          />
        </div>
      </div>
      <Button onClick={handleApply} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">Appliquer les filtres</Button>
    </DialogContent>
  )
}

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col items-start">
    <div className="flex items-center text-sm text-gray-500 gap-2">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
    <p className="font-semibold text-gray-800 mt-1">{value || '-'}</p>
  </div>
);

const ArrayDetailItem = ({ icon: Icon, label, values }) => (
    <div className="flex flex-col items-start col-span-2 md:col-span-3">
        <div className="flex items-center text-sm text-gray-500 gap-2">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
            {(values && values.length > 0) ? values.map((item, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{item}</span>
            )) : <p className="font-semibold text-gray-800">-</p>}
        </div>
    </div>
);


const Rencontre = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [view, setView] = useState('card');
  const [myProfile, setMyProfile] = useState(null);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    sexe: 'all',
    countryId: '',
    cityId: '',
    ageRange: [18, 65],
    rencontreTypeId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [canInteract, setCanInteract] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [canView, setCanView] = useState(false); // ✅ nouveau

  const { toast } = useToast();

  // ✅ 1. Vérification de l'authentification
  useEffect(() => {
    (async () => {
      try {
        await requireAuth(navigate);
      } catch {
        return;
      }
    })();
  }, []);

  // ✅ 2. Vérifications des accès selon le plan Supabase
  useEffect(() => {
  if (user) {
    (async () => {
      const canCreate = await canUserAccess(user, 'create_rencontre');
      const canAccess = await canUserAccess(user, 'rencontre_access');
      console.log('DEBUG ➤ canCreate:', canCreate, 'canAccess:', canAccess);
      setCanInteract(canCreate);
      setCanView(canAccess);
    })();
  } else {
    setCanInteract(false);
    setCanView(false);
    setAccessReady(true);
  }
}, [user]);


  const fetchMyProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    };
    setLoading(true);
    const { data, error } = await supabase.from('rencontres').select('id').eq('user_id', user.id).single();
    if (data) {
      setMyProfile(data);
    } else if (error && error.code !== 'PGRST116') {
      console.error("Error fetching my rencontre profile:", error);
    }
    setLoading(false);
  }, [user]);

  const fetchProfiles = useCallback(async () => {
  if (!user) {
    setLoading(false);
    return;
  }

  // ✅ Si l’utilisateur n’a pas encore de profil, on ne bloque pas la page
  if (!myProfile) {
    setLoading(false);
    return;
  }

  setLoading(true);

  const { data: swipedUserIdsData } = await supabase
    .from('rencontres_likes')
    .select('liked_id')
    .eq('liker_id', myProfile.id);

      
    const swipedRencontreIds = swipedUserIdsData ? swipedUserIdsData.map(l => l.liked_id) : [];

    let query = supabase.from('rencontres').select('*, ville:ville_id(nom)').neq('user_id', user.id);
    
    if (swipedRencontreIds.length > 0) {
      query = query.not('id', 'in', `(${swipedRencontreIds.join(',')})`);
    }
    if (filters.sexe !== 'all') query = query.eq('sexe', filters.sexe);
    if (filters.countryId) query = query.eq('pays_id', filters.countryId);
    if (filters.cityId) query = query.eq('ville_id', filters.cityId);
    if (filters.rencontreTypeId) query = query.eq('type_rencontre_souhaite_id', filters.rencontreTypeId);
    query = query.gte('age', filters.ageRange[0]).lte('age', filters.ageRange[1]);

    const { data, error } = await query;

    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les profils.", variant: "destructive" });
    } else {
      setProfiles(data || []);
      setCurrentIndex(0);
    }
    setLoading(false);
  }, [user, myProfile, filters]);
  
  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile]);

  useEffect(() => {
    if (myProfile) {
      fetchProfiles();
    }
  }, [myProfile, fetchProfiles]);

  const handleAction = async (likedProfileId, action) => {
  // ✅ Vérifie si l’utilisateur est connecté
  if (!user) {
    toast({
      title: "Connexion requise",
      description: "Connectez-vous pour interagir.",
      variant: "destructive",
    });
    navigate('/auth');
    return;
  }

  // ✅ Vérifie si le plan autorise les interactions (VIP/Admin)
  if (!canInteract) {
    toast({
      title: "Accès réservé",
      description: "Cette action est réservée aux membres VIP.",
      variant: "destructive",
    });
    return;
  }

  if (!myProfile) return;

  if (action === 'like') {
    const { error } = await supabase
      .from('rencontres_likes')
      .insert({ liker_id: myProfile.id, liked_id: likedProfileId });

    if (error && error.code !== '23505') { // 23505 = unique_violation
      toast({
        title: 'Erreur',
        description: "Le like n'a pas pu être enregistré.",
        variant: 'destructive',
      });
    }
  }

  setView('card');
  setCurrentIndex((prev) => prev + 1);
};


  useEffect(() => {
    if (!myProfile) return;

    const channel = supabase
      .channel('rencontres_matches')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rencontres_matches',
      }, (payload) => {
        const match = payload.new;
        if (match.user1_id === myProfile.id || match.user2_id === myProfile.id) {
          toast({
            title: "C’est un match ! 💚",
            description: "Vous avez un nouveau match. Consultez vos messages."
          });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [myProfile, toast]);


  const currentProfile = profiles[currentIndex];
  
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></div>;
  }
  
  if (!user) {
     return <div className="text-center p-8">Veuillez vous connecter pour accéder aux rencontres.</div>
  }
  
  if (!myProfile && canView) {
  return <RencontreProfil />;
}

if (!accessReady) {
  return null; // ⏳ attend la vérification avant d'afficher quoi que ce soit
}

if (!canView) {
  return (
    <div className="text-center p-8">
      Accès restreint — cette fonctionnalité est réservée aux membres disposant d’un plan supérieur.
    </div>
  );
}



  return (
    <>
      <Helmet>
        <title>Rencontres - OneKamer.co</title>
        <meta name="description" content="Rencontrez des membres de la communauté sur OneKamer.co" />
      </Helmet>

      <div className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {view === 'card' ? (
            <motion.div
              key={`card-${currentProfile?.id || 'empty'}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                 <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-transparent bg-clip-text">Rencontres</h1>
                 <div className="flex items-center gap-2">
                     <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/rencontre/profil')}><UserCircle2 className="h-6 w-6 text-gray-600" /></Button>
                     <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/rencontre/messages')}><Mail className="h-6 w-6 text-gray-600" /></Button>
                     <Dialog open={showFilters} onOpenChange={setShowFilters}>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="rounded-full"><SlidersHorizontal className="h-6 w-6 text-gray-600" /></Button>
                        </DialogTrigger>
                        <FiltersDialog filters={filters} setFilters={setFilters} onApply={() => { fetchProfiles(); setShowFilters(false); }} />
                     </Dialog>
                 </div>
              </div>

              {!currentProfile ? (
                 <div className="text-center p-8 h-[70vh] flex flex-col justify-center items-center gap-4 bg-white rounded-2xl shadow-lg">
                    <Users className="h-16 w-16 text-gray-300" />
                    <p className="font-semibold text-xl">Plus de profils pour le moment</p>
                    <p className="text-gray-500">Revenez plus tard ou ajustez vos filtres.</p>
                 </div>
              ) : (
                <Card className="overflow-hidden shadow-lg rounded-2xl">
                  <div className="relative h-[55vh] max-h-[450px]">
                    <MediaDisplay bucket="rencontres" path={currentProfile.image_url} alt={currentProfile.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                      <h2 className="text-3xl font-bold">{currentProfile.name?.split(' ')[0]}, {currentProfile.age}</h2>
                      <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" /><span>{currentProfile.ville?.nom || currentProfile.city}</span></div>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-gray-700 h-10 overflow-hidden">{currentProfile.bio}</p>
                    <div className="flex justify-around items-center pt-4">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction(currentProfile.id, 'pass')} className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-md"><X className="h-8 w-8 text-gray-500" /></motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction(currentProfile.id, 'like')} className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"><Heart className="h-10 w-10 text-white" fill="white" /></motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setView('detail')} className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-md"><Eye className="h-8 w-8 text-gray-500" /></motion.button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`detail-${currentProfile.id}`}
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
            >
              <button onClick={() => setView('card')} className="flex items-center gap-2 text-green-600 font-semibold"><ArrowLeft className="h-5 w-5" />Retour</button>
              <div className="text-center">
                <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-green-200"><MediaDisplay bucket="rencontres" path={currentProfile.image_url} alt={currentProfile.name} className="w-full h-full object-cover" /></div>
                <h2 className="text-3xl font-bold text-gray-800">{currentProfile.name?.split(' ')[0]}, {currentProfile.age}</h2>
                <div className="flex items-center justify-center gap-4 text-gray-500 text-sm mt-2">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {currentProfile.ville?.nom || currentProfile.city}</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {currentProfile.profession}</span>
                </div>
              </div>

              <div className="space-y-2">
                 {currentProfile.bio && (
                  <>
                    <h3 className="font-bold text-lg text-gray-800">Bio</h3>
                    <p className="text-gray-600 font-medium italic mb-2">{currentProfile.bio}</p>
                  </>
                )}
                <h3 className="font-bold text-lg text-gray-800">À propos de moi</h3>
                <p className="text-gray-600">{currentProfile.long_bio}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 pt-2">
                <DetailItem icon={User} label="Sexe" value={currentProfile.sexe} />
                {currentProfile.show_taille && <DetailItem icon={Ruler} label="Taille" value={currentProfile.taille} />}
                {currentProfile.show_poids && <DetailItem icon={Weight} label="Poids" value={currentProfile.poids} />}
                {currentProfile.show_ethnie && <DetailItem icon={Users} label="Ethnie" value={currentProfile.ethnie} />}
                <DetailItem icon={Cigarette} label="Fume" value={currentProfile.fume} />
                <DetailItem icon={GlassWater} label="Bois" value={currentProfile.bois} />
                <DetailItem icon={Baby} label="Enfant(s)" value={`${currentProfile.enfant}${currentProfile.enfant === 'Oui' && currentProfile.show_nombre_enfant ? ` (${currentProfile.nombre_enfant})` : ''}`} />
                <DetailItem icon={Paintbrush} label="Tatouage(s)" value={currentProfile.tatouage} />
                <DetailItem icon={Gem} label="Piercing(s)" value={currentProfile.piercing} />
                <DetailItem icon={Film} label="Film préféré" value={currentProfile.film} />
                <DetailItem icon={Tv} label="Série préférée" value={currentProfile.serie} />
                <DetailItem icon={Music} label="Musique préférée" value={currentProfile.musique} />
                <DetailItem icon={BookOpen} label="Livre préféré" value={currentProfile.livre} />
                <DetailItem icon={GraduationCap} label="Niveau d'études" value={currentProfile.niveau_etudes} />
                <DetailItem icon={Award} label="Secteur d'activité" value={currentProfile.secteur_activite} />
                <ArrayDetailItem icon={Sparkles} label="Centres d'intérêt" values={currentProfile.centres_interet} />
                <ArrayDetailItem icon={Languages} label="Langues parlées" values={currentProfile.langues_parlees} />
                <ArrayDetailItem icon={Code} label="Compétences techniques" values={currentProfile.competences_techniques} />
                <ArrayDetailItem icon={Users} label="Compétences humaines" values={currentProfile.competences_humaines} />
              </div>

              <div className="flex justify-around items-center pt-4">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction(currentProfile.id, 'pass')} className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-200"><X className="h-8 w-8 text-gray-600" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction(currentProfile.id, 'like')} className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"><Heart className="h-10 w-10 text-white" fill="white" /></motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Rencontre;
