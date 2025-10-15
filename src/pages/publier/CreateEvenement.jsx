
    import React, { useState, useEffect, useRef, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { useNavigate } from 'react-router-dom';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { ArrowLeft, Clock, Euro, MapPin, Image as ImageIcon, Loader2, X, Tag, Phone, Mail, Globe, User } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import imageCompression from 'browser-image-compression';
    import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
    
    const mapContainerStyle = {
      width: '100%',
      height: '250px',
      borderRadius: '0.5rem',
    };
    
    const defaultCenter = {
      lat: 48.8566,
      lng: 2.3522,
    };
    
    const libraries = ['places'];
    
    const CreateEvenement = () => {
      const navigate = useNavigate();
      const { user } = useAuth();
      const [formData, setFormData] = useState({ title: '', date: '', time: '', location: '', price: '', description: '', type_id: '', telephone: '', email: '', site_web: '', organisateur: '', latitude: null, longitude: null, devise_id: '' });
      const [types, setTypes] = useState([]);
      const [devises, setDevises] = useState([]);
      const [mediaFile, setMediaFile] = useState(null);
      const [mediaPreview, setMediaPreview] = useState(null);
      const [isUploading, setIsUploading] = useState(false);
      const [coords, setCoords] = useState(null);
      const autocompleteRef = useRef(null);
    
      const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
      });
    
      useEffect(() => {
        const fetchInitialData = async () => {
          const { data: typesData, error: typesError } = await supabase.from('evenements_types').select('id, nom');
          if (typesError) {
            toast({ title: 'Erreur', description: 'Impossible de charger les types d\'événements.', variant: 'destructive' });
          } else {
            setTypes(typesData);
          }
          const { data: devisesData, error: devisesError } = await supabase.from('devises').select('id, nom, symbole');
          if (devisesError) toast({ title: 'Erreur', description: 'Impossible de charger les devises.', variant: 'destructive' });
          else {
              setDevises(devisesData);
              const defaultDevise = devisesData.find(d => d.code_iso === 'EUR') || devisesData[0];
              if(defaultDevise) {
                setFormData(prev => ({...prev, devise_id: defaultDevise.id}));
              }
          }
        };
        fetchInitialData();
      }, []);
    
      const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (id === 'price') {
             const numericValue = value.replace(/[^0-9,.]/g, '').replace(',', '.');
             setFormData(prev => ({ ...prev, [id]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
      };
      
      const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setMediaFile(file);
          setMediaPreview(URL.createObjectURL(file));
        }
      };
    
      const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
      };
    
      const onPlaceChanged = useCallback(() => {
        if (autocompleteRef.current !== null) {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setCoords({ lat, lng });
            setFormData(prev => ({ ...prev, location: place.formatted_address, latitude: lat, longitude: lng }));
          } else {
            setFormData(prev => ({ ...prev, location: place.name }));
          }
        }
      }, []);
      
      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
          toast({ title: 'Erreur', description: 'Vous devez être connecté pour publier.', variant: 'destructive' });
          return;
        }
        if (!formData.title || !formData.type_id || !formData.organisateur || !formData.date || !formData.time || !formData.location || !formData.description || !formData.devise_id) {
          toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' });
          return;
        }
        
        setIsUploading(true);
        let mediaPath = null;
        let mediaType = null;
    
        try {
          if (mediaFile) {
            let finalFile = mediaFile;
            if (mediaFile.type.startsWith('image')) {
              const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
              finalFile = await imageCompression(mediaFile, options);
            }
            
            const fileExt = finalFile.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage.from('evenements').upload(filePath, finalFile);
            if (uploadError) throw uploadError;
            
            mediaPath = uploadData.path;
            mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
          }
    
          const submissionData = { ...formData, user_id: user.id, author_id: user.id, media_url: mediaPath, media_type: mediaType, price: parseFloat(formData.price) || 0 };
    
          const { error } = await supabase.from('evenements').insert([submissionData]);
          
          if (error) throw error;
          
          toast({ title: 'Succès !', description: 'Votre événement a été publié.' });
          navigate('/evenements');
    
        } catch (error) {
          toast({ title: 'Erreur de publication', description: error.message, variant: 'destructive' });
        } finally {
          setIsUploading(false);
        }
      };
    
    
      return (
        <>
          <Helmet><title>Créer un Événement - OneKamer.co</title></Helmet>
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
              <h1 className="text-3xl font-bold text-[#2BA84A] mb-6">Créer un événement</h1>
            </motion.div>
    
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader><CardTitle>Informations de l'événement</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2"><Label htmlFor="title">Titre de l'événement *</Label><Input id="title" placeholder="Ex: Soirée Makossa" required value={formData.title} onChange={handleInputChange} /></div>
                     <div className="space-y-2"><Label htmlFor="organisateur">Organisateur *</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input id="organisateur" placeholder="Nom de l'organisateur ou de l'association" className="pl-10" required value={formData.organisateur} onChange={handleInputChange} /></div></div>
                    <div className="space-y-2">
                      <Label htmlFor="type_id">Type d'événement *</Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select id="type_id" value={formData.type_id} onChange={handleInputChange} className="pl-10 flex h-10 w-full rounded-md border border-[#2BA84A]/30 bg-white px-3 py-2 text-sm" required>
                          <option value="" disabled>Sélectionner un type</option>
                          {types.map(type => <option key={type.id} value={type.id}>{type.nom}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="date">Date *</Label><Input id="date" type="date" required value={formData.date} onChange={handleInputChange} /></div>
                      <div className="space-y-2"><Label htmlFor="time">Heure *</Label><div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input id="time" type="time" className="pl-10" required value={formData.time} onChange={handleInputChange} /></div></div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Lieu *</Label>
                      {isLoaded && (
                        <Autocomplete
                          onLoad={(ref) => autocompleteRef.current = ref}
                          onPlaceChanged={onPlaceChanged}
                        >
                          <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input id="location" placeholder="Rechercher une adresse..." className="pl-10" required value={formData.location} onChange={handleInputChange}/></div>
                        </Autocomplete>
                      )}
                      {isLoaded && <GoogleMap mapContainerStyle={mapContainerStyle} center={coords || defaultCenter} zoom={coords ? 15 : 10}><>{coords && <Marker position={coords} />}</></GoogleMap>}
                      {loadError && <div>Erreur de chargement de la carte.</div>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Prix</Label>
                        <div className="relative">
                          <Input id="price" type="text" inputMode="decimal" placeholder="Ex: 25" value={formData.price} onChange={handleInputChange}/>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="devise_id">Devise *</Label>
                        <div className="relative">
                          <select id="devise_id" value={formData.devise_id} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-[#2BA84A]/30 bg-white px-3 py-2 text-sm" required>
                            <option value="" disabled>Choisir</option>
                            {devises.map(d => <option key={d.id} value={d.id}>{d.nom} ({d.symbole})</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="telephone">Téléphone de contact</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input id="telephone" type="tel" title="Veuillez entrer un numéro de téléphone valide au format international (ex: +33612345678)." className="pl-10" value={formData.telephone} onChange={handleInputChange} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Format international suggéré (ex: +33612345678)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email de contact</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input id="email" type="email" className="pl-10" value={formData.email} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2"><Label htmlFor="site_web">Site web (billetterie)</Label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input id="site_web" type="url" placeholder="https://..." className="pl-10" value={formData.site_web} onChange={handleInputChange} /></div></div>
                    <div className="space-y-2">
                      <Label>Image / Vidéo</Label>
                      <Card className="p-4 border-dashed"><CardContent className="flex flex-col items-center justify-center text-center p-0">
                          {mediaPreview ? (
                            <div className="relative">
                              {mediaFile.type.startsWith('image') ? <img alt="Aperçu" src={mediaPreview} className="max-h-48 rounded-md mb-4"/> : <video src={mediaPreview} className="max-h-48 rounded-md mb-4" controls />}
                              <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeMedia}><X className="h-4 w-4" /></Button>
                            </div>
                          ) : (<ImageIcon className="h-12 w-12 text-gray-400 mb-2" />)}
                          <Label htmlFor="media-upload" className="text-[#2BA84A] font-semibold cursor-pointer">{mediaPreview ? "Changer le média" : "Choisir une image ou vidéo"}</Label>
                          <Input id="media-upload" type="file" className="hidden" accept="image/*,video/*" onChange={handleMediaChange} />
                      </CardContent></Card>
                    </div>
                    <div className="space-y-2"><Label htmlFor="description">Description *</Label><Textarea id="description" placeholder="Décrivez l'événement..." rows={4} required value={formData.description} onChange={handleInputChange} /></div>
                    <Button type="submit" className="w-full bg-[#2BA84A] hover:bg-[#2BA84A]/90" disabled={isUploading}>
                      {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publication...</> : "Publier l'événement"}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </motion.div>
          </div>
        </>
      );
    };
    
    export default CreateEvenement;
  