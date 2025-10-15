import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building, Phone, MapPin, Tag, Globe, Image as ImageIcon, Loader2, X, Mail } from 'lucide-react';
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

const ProposerPartenaire = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: '', category_id: '', address: '', phone: '', website: '', email: '', description: '', recommandation: '' });
  const [categories, setCategories] = useState([]);
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
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('partenaires_categories').select('id, nom');
      if (error) {
        toast({ title: 'Erreur', description: 'Impossible de charger les catégories.', variant: 'destructive' });
      } else {
        setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
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

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setCoords({ lat, lng });
        setFormData(prev => ({ ...prev, address: place.formatted_address, latitude: lat, longitude: lng }));
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté pour publier.', variant: 'destructive' });
      return;
    }
    if (!formData.category_id) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner une catégorie.', variant: 'destructive' });
      return;
    }
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast({ title: 'Erreur', description: 'Veuillez entrer un numéro de téléphone valide au format international (ex: +33612345678).', variant: 'destructive' });
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
        
        const { data: uploadData, error: uploadError } = await supabase.storage.from('partenaires').upload(filePath, finalFile);
        if (uploadError) throw uploadError;
        
        mediaPath = uploadData.path;
        mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
      }

      const { error } = await supabase.from('partenaires').insert([{ 
        ...formData, 
        user_id: user.id,
        media_url: mediaPath,
        media_type: mediaType,
      }]);
      
      if (error) throw error;
      
      toast({ title: 'Succès !', description: 'Votre partenaire a été proposé.' });
      navigate('/partenaires');

    } catch (error) {
      toast({ title: 'Erreur de publication', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Helmet><title>Proposer un Partenaire - OneKamer.co</title></Helmet>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
          <h1 className="text-3xl font-bold text-[#F9C400] mb-6">Proposer un partenaire</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader><CardTitle>Informations du partenaire</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2"><Label htmlFor="name">Nom de l'établissement</Label><div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input id="name" placeholder="Ex: Restaurant Chez Maman" className="pl-10" required value={formData.name} onChange={handleInputChange} /></div></div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">Catégorie</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select id="category_id" value={formData.category_id} onChange={handleInputChange} className="pl-10 flex h-10 w-full rounded-md border border-[#2BA84A]/30 bg-white px-3 py-2 text-sm" required>
                      <option value="" disabled>Sélectionner une catégorie</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nom}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  {isLoaded && (
                    <Autocomplete
                      onLoad={(ref) => autocompleteRef.current = ref}
                      onPlaceChanged={onPlaceChanged}
                    >
                      <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input id="address" placeholder="Rechercher une adresse..." className="pl-10" required value={formData.address} onChange={handleInputChange} /></div>
                    </Autocomplete>
                  )}
                  {isLoaded && <GoogleMap mapContainerStyle={mapContainerStyle} center={coords || defaultCenter} zoom={coords ? 15 : 10}><>{coords && <Marker position={coords} />}</></GoogleMap>}
                  {loadError && <div>Erreur de chargement de la carte.</div>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="phone" type="tel" placeholder="+33612345678" className="pl-10" value={formData.phone} onChange={handleInputChange} pattern="^\+?[1-9]\d{1,14}$" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Format international attendu.</p>
                </div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input id="email" type="email" placeholder="contact@example.com" className="pl-10" value={formData.email} onChange={handleInputChange} /></div></div>
                <div className="space-y-2"><Label htmlFor="website">Site Web</Label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input id="website" type="url" placeholder="https://example.com" className="pl-10" value={formData.website} onChange={handleInputChange} /></div></div>
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
                <div className="space-y-2"><Label htmlFor="description">Description de l'activité</Label><Textarea id="description" placeholder="Décrivez l'activité du partenaire..." rows={4} required value={formData.description} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="recommandation">Pourquoi le recommandez-vous ?</Label><Textarea id="recommandation" placeholder="Expliquez pourquoi vous recommandez ce partenaire..." rows={3} required value={formData.recommandation} onChange={handleInputChange} /></div>
                <Button type="submit" className="w-full bg-[#F9C400] hover:bg-[#F9C400]/90 text-white" disabled={isUploading}>
                  {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publication...</> : "Envoyer la proposition"}
                </Button>
              </CardContent>
            </Card>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default ProposerPartenaire;