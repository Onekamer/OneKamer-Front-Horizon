import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Camera, Pencil, MapPin, Briefcase, User, Ruler, Weight, Users, Cigarette, GlassWater, Baby, Paintbrush, Gem, Tv, Music, Film, Book, Sparkles, Languages, Code, Award, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import imageCompression from 'browser-image-compression';
import MediaDisplay from '@/components/MediaDisplay';
import { Switch } from "@/components/ui/switch";

const ChoiceButton = ({ value, selectedValue, onSelect, children }) => (
    <Button
      type="button"
      variant={selectedValue === value ? "default" : "outline"}
      onClick={() => onSelect(value)}
      className="flex-1"
    >
      {children}
    </Button>
);

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


const RencontreProfil = () => {
  const { user, profile: userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fume: 'Non',
    bois: 'Non',
    tatouage: 'Non',
    enfant: 'Non',
    nombre_enfant: null,
    show_taille: true,
    show_poids: true,
    show_ethnie: true,
    show_nombre_enfant: true,
    centres_interet: [],
    langues_parlees: [],
    competences_techniques: [],
    competences_humaines: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [rencontreTypes, setRencontreTypes] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('rencontres').select('*, pays:pays_id(id, nom), ville:ville_id(id, nom)').eq('user_id', user.id).single();

    if (error && error.code === 'PGRST116') {
      setIsEditing(true);
      setHasProfile(false);
      if (userProfile?.avatar_url) {
        setImagePreview(userProfile.avatar_url);
      }
      setProfile(p => ({ ...p, image_url: userProfile?.avatar_url, name: userProfile?.username, user_id: user.id }))
    } else if (data) {
      setProfile(prev => ({...prev, ...data}));
      setImagePreview(data.image_url);
      setHasProfile(true);
    } else if (error) {
       toast({ title: 'Erreur', description: 'Impossible de charger votre profil Rencontre.', variant: 'destructive' });
    }
    setLoading(false);
  }, [user, userProfile, toast]);

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
    fetchProfile();
    fetchInitialData();
  }, [fetchProfile, fetchInitialData]);

  useEffect(() => {
    if (profile.pays_id) {
      fetchCities(typeof profile.pays_id === 'object' ? profile.pays_id.id : profile.pays_id);
    }
  }, [profile.pays_id, fetchCities]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (['centres_interet', 'langues_parlees', 'competences_techniques', 'competences_humaines'].includes(name)) {
      setProfile(prev => ({ ...prev, [name]: value.split(',').map(s => s.trim()).filter(s => s) }));
    } else {
      const processedValue = type === 'number' ? (value === '' ? null : parseInt(value, 10)) : value;
      setProfile(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleSelectChange = (name, value) => {
    setProfile(prev => ({ ...prev, [name]: value}));
    if (name === 'pays_id') {
      setProfile(prev => ({ ...prev, ville_id: null }));
      fetchCities(value);
    }
  };
  
  const handleChoiceChange = (name, value) => {
    setProfile(prev => ({ ...prev, [name]: value }));
    if (name === 'enfant' && value === 'Non') {
      setProfile(prev => ({ ...prev, nombre_enfant: null }));
    }
  };
  
  const handleSwitchChange = (name, checked) => {
    setProfile(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true };
    try {
      const compressedFile = await imageCompression(file, options);
      setImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      toast({ title: "Erreur d'image", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    let imageUrlPath = profile.image_url;
    if (imageFile) {
        const filePath = `rencontres/${user.id}/${Date.now()}_${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('rencontres').upload(filePath, imageFile, { upsert: true });

        if (uploadError) {
            toast({ title: 'Erreur d\'upload', description: uploadError.message, variant: 'destructive' });
            setSaving(false);
            return;
        }
        imageUrlPath = filePath;
    }
    
    const { created_at, id, pays, ville, ...rest } = profile;

    const updateData = {
      ...rest,
      image_url: imageUrlPath,
      user_id: user.id,
      updated_at: new Date(),
    };

    if (updateData.enfant === 'Oui' && (!updateData.nombre_enfant || updateData.nombre_enfant <= 0)) {
        toast({ title: 'Information manquante', description: 'Veuillez indiquer le nombre d\'enfants.', variant: 'destructive' });
        setSaving(false);
        return;
    }

    const { error } = await supabase.from('rencontres').upsert(updateData, { onConflict: 'user_id', defaultToNull: false });

    if (error) {
      console.error("Supabase upsert error:", error);
      toast({ title: 'Erreur', description: `La mise à jour a échoué: ${error.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Votre profil a été mis à jour !' });
      await refreshProfile();
      await fetchProfile();
      setIsEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></div>;
  }
  
  if (!isEditing) {
    const enfantValue = `${profile.enfant}${profile.enfant === 'Oui' && profile.show_nombre_enfant ? ` (${profile.nombre_enfant || 'N/A'})` : ''}`;

    return (
      <>
        <Helmet>
          <title>Aperçu Profil Rencontres - OneKamer.co</title>
        </Helmet>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto pb-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/rencontre')}><ArrowLeft className="h-6 w-6" /></Button>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-transparent bg-clip-text">Mon Profil Rencontres</h1>
              <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"><Pencil className="h-4 w-4 mr-2" />Modifier</Button>
            </div>
            <Card className="p-4 md:p-6 space-y-6">
                <div className="text-center">
                    <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-green-200">
                      <MediaDisplay bucket="rencontres" path={profile.image_url} alt={profile.name} className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">{profile.name?.split(' ')[0]}, {profile.age}</h2>
                    <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-gray-500 text-sm mt-2">
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {profile.ville?.nom || profile.city}</span>
                      <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {profile.profession}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    {profile.bio && (
                      <>
                        <h3 className="font-bold text-lg text-gray-800">Bio</h3>
                        <p className="text-gray-600 font-medium italic mb-2">{profile.bio}</p>
                      </>
                    )}
                    <h3 className="font-bold text-lg text-gray-800">À propos de moi</h3>
                    <p className="text-gray-600">{profile.long_bio}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 pt-2">
                  <DetailItem icon={User} label="Sexe" value={profile.sexe} />
                  {profile.show_taille && <DetailItem icon={Ruler} label="Taille" value={profile.taille} />}
                  {profile.show_poids && <DetailItem icon={Weight} label="Poids" value={profile.poids} />}
                  {profile.show_ethnie && <DetailItem icon={Users} label="Ethnie" value={profile.ethnie} />}
                  <DetailItem icon={Cigarette} label="Fume" value={profile.fume} />
                  <DetailItem icon={GlassWater} label="Bois" value={profile.bois} />
                  <DetailItem icon={Baby} label="Enfant(s)" value={enfantValue} />
                  <DetailItem icon={Paintbrush} label="Tatouage(s)" value={profile.tatouage} />
                  <DetailItem icon={Gem} label="Piercing(s)" value={profile.piercing} />
                  <DetailItem icon={Film} label="Film préféré" value={profile.film} />
                  <DetailItem icon={Tv} label="Série préférée" value={profile.serie} />
                  <DetailItem icon={Music} label="Musique préférée" value={profile.musique} />
                  <DetailItem icon={Book} label="Livre préféré" value={profile.livre} />
                  <DetailItem icon={GraduationCap} label="Niveau d'études" value={profile.niveau_etudes} />
                  <DetailItem icon={Award} label="Secteur d'activité" value={profile.secteur_activite} />
                  <ArrayDetailItem icon={Sparkles} label="Centres d'intérêt" values={profile.centres_interet} />
                  <ArrayDetailItem icon={Languages} label="Langues parlées" values={profile.langues_parlees} />
                  <ArrayDetailItem icon={Code} label="Compétences techniques" values={profile.competences_techniques} />
                  <ArrayDetailItem icon={Users} label="Compétences humaines" values={profile.competences_humaines} />
                </div>
            </Card>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Modifier Profil Rencontres - OneKamer.co</title>
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto pb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => hasProfile ? setIsEditing(false) : navigate('/rencontre')}><ArrowLeft className="h-6 w-6" /></Button>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-transparent bg-clip-text">Modifier Mon Profil</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    {imagePreview ? (
                      <AvatarImage src={imagePreview.startsWith('blob:') ? imagePreview : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/rencontres/${imagePreview}`} alt="Aperçu" />
                    ) : null }
                    <AvatarFallback>
                      <User className="h-16 w-16 text-gray-400" />
                    </AvatarFallback>
                  </Avatar>
                  <Button type="button" size="icon" className="absolute bottom-0 right-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white" onClick={() => fileInputRef.current.click()}>
                    <Camera className="h-5 w-5" />
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Label htmlFor="name">Nom/Pseudo</Label><Input id="name" name="name" value={profile.name || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="age">Âge</Label><Input id="age" name="age" type="number" value={profile.age || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="sexe">Sexe</Label>
                  <Select onValueChange={(value) => handleSelectChange('sexe', value)} value={profile.sexe || ''}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez votre sexe" /></SelectTrigger>
                    <SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="type_rencontre_souhaite_id">Type de rencontre</Label>
                  <Select onValueChange={(value) => handleSelectChange('type_rencontre_souhaite_id', value ? parseInt(value) : null)} value={profile.type_rencontre_souhaite_id?.toString() || ''}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez un type" /></SelectTrigger>
                    <SelectContent>{rencontreTypes.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="pays_id">Pays</Label>
                  <Select onValueChange={(value) => handleSelectChange('pays_id', value)} value={profile.pays_id?.id?.toString() || profile.pays_id?.toString() || ''}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez un pays" /></SelectTrigger>
                    <SelectContent position="popper" className="max-h-[20rem]">{countries.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="ville_id">Ville</Label>
                  <Select onValueChange={(value) => handleSelectChange('ville_id', value)} value={profile.ville_id?.id?.toString() || profile.ville_id?.toString() || ''} disabled={!profile.pays_id || cities.length === 0}>
                    <SelectTrigger><SelectValue placeholder={!profile.pays_id ? "Sélectionnez un pays" : "Sélectionnez une ville"} /></SelectTrigger>
                    <SelectContent position="popper" className="max-h-[20rem]">{cities.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="profession">Profession</Label><Input id="profession" name="profession" value={profile.profession || ''} onChange={handleChange} /></div>
                
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="taille">Taille (ex: 1m80)</Label>
                      <Switch id="show_taille" checked={profile.show_taille} onCheckedChange={(c) => handleSwitchChange('show_taille', c)} />
                    </div>
                    <Input id="taille" name="taille" value={profile.taille || ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="poids">Poids (ex: 75kg)</Label>
                      <Switch id="show_poids" checked={profile.show_poids} onCheckedChange={(c) => handleSwitchChange('show_poids', c)} />
                    </div>
                    <Input id="poids" name="poids" value={profile.poids || ''} onChange={handleChange} />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ethnie">Ethnie</Label>
                      <Switch id="show_ethnie" checked={profile.show_ethnie} onCheckedChange={(c) => handleSwitchChange('show_ethnie', c)} />
                    </div>
                    <Input id="ethnie" name="ethnie" value={profile.ethnie || ''} onChange={handleChange} />
                </div>

                <div className="md:col-span-2"><Label htmlFor="bio">Bio Courte (max 255)</Label><Textarea id="bio" name="bio" value={profile.bio || ''} onChange={handleChange} maxLength={255} /></div>
                <div className="md:col-span-2"><Label htmlFor="long_bio">À propos de moi</Label><Textarea id="long_bio" name="long_bio" value={profile.long_bio || ''} onChange={handleChange} rows={5} /></div>
                
                <div><Label htmlFor="film">Film préféré</Label><Input id="film" name="film" value={profile.film || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="serie">Série préférée</Label><Input id="serie" name="serie" value={profile.serie || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="musique">Musique préférée</Label><Input id="musique" name="musique" value={profile.musique || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="livre">Livre préféré</Label><Input id="livre" name="livre" value={profile.livre || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="niveau_etudes">Niveau d'études</Label><Input id="niveau_etudes" name="niveau_etudes" value={profile.niveau_etudes || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="secteur_activite">Secteur d'activité</Label><Input id="secteur_activite" name="secteur_activite" value={profile.secteur_activite || ''} onChange={handleChange} /></div>

                <div className="md:col-span-2"><Label htmlFor="centres_interet">Centres d'intérêt (séparés par une virgule)</Label><Textarea id="centres_interet" name="centres_interet" value={profile.centres_interet?.join(', ') || ''} onChange={handleChange} /></div>
                <div className="md:col-span-2"><Label htmlFor="langues_parlees">Langues parlées (séparées par une virgule)</Label><Input id="langues_parlees" name="langues_parlees" value={profile.langues_parlees?.join(', ') || ''} onChange={handleChange} /></div>
                <div className="md:col-span-2"><Label htmlFor="competences_techniques">Compétences techniques (séparées par une virgule)</Label><Input id="competences_techniques" name="competences_techniques" value={profile.competences_techniques?.join(', ') || ''} onChange={handleChange} /></div>
                <div className="md:col-span-2"><Label htmlFor="competences_humaines">Compétences humaines (séparées par une virgule)</Label><Input id="competences_humaines" name="competences_humaines" value={profile.competences_humaines?.join(', ') || ''} onChange={handleChange} /></div>

                <div className="space-y-2">
                    <Label>Fumeur/se ?</Label>
                    <div className="flex items-center space-x-2">
                        <ChoiceButton value="Oui" selectedValue={profile.fume} onSelect={(v) => handleChoiceChange('fume', v)}>Oui</ChoiceButton>
                        <ChoiceButton value="Non" selectedValue={profile.fume} onSelect={(v) => handleChoiceChange('fume', v)}>Non</ChoiceButton>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Buveur/se ?</Label>
                    <div className="flex items-center space-x-2">
                        <ChoiceButton value="Oui" selectedValue={profile.bois} onSelect={(v) => handleChoiceChange('bois', v)}>Oui</ChoiceButton>
                        <ChoiceButton value="Non" selectedValue={profile.bois} onSelect={(v) => handleChoiceChange('bois', v)}>Non</ChoiceButton>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Tatouage(s) ?</Label>
                    <div className="flex items-center space-x-2">
                        <ChoiceButton value="Oui" selectedValue={profile.tatouage} onSelect={(v) => handleChoiceChange('tatouage', v)}>Oui</ChoiceButton>
                        <ChoiceButton value="Non" selectedValue={profile.tatouage} onSelect={(v) => handleChoiceChange('tatouage', v)}>Non</ChoiceButton>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Enfant(s) ?</Label>
                     <div className="flex items-center space-x-2">
                        <ChoiceButton value="Oui" selectedValue={profile.enfant} onSelect={(v) => handleChoiceChange('enfant', v)}>Oui</ChoiceButton>
                        <ChoiceButton value="Non" selectedValue={profile.enfant} onSelect={(v) => handleChoiceChange('enfant', v)}>Non</ChoiceButton>
                    </div>
                </div>
                 {profile.enfant === 'Oui' && (
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="nombre_enfant">Nombre d'enfants</Label>
                      <Switch id="show_nombre_enfant" checked={profile.show_nombre_enfant} onCheckedChange={(c) => handleSwitchChange('show_nombre_enfant', c)} />
                    </div>
                    <Input id="nombre_enfant" name="nombre_enfant" type="number" value={profile.nombre_enfant || ''} onChange={handleChange} min="1" />
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4"><Button type="submit" disabled={saving} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer</Button></div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default RencontreProfil;