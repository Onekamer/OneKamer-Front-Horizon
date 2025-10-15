
    import React, { useState, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { useNavigate } from 'react-router-dom';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { ArrowLeft, Image as ImageIcon, Tag, Euro, MapPin, Loader2, X, Globe, Phone, Mail } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import imageCompression from 'browser-image-compression';

    const CreateAnnonce = () => {
      const navigate = useNavigate();
      const { user } = useAuth();
      const [formData, setFormData] = useState({ 
        titre: '', 
        categorie_id: '', 
        prix: '', 
        pays_id: '',
        ville_id: '',
        telephone: '',
        email: '',
        description: '',
        devise_id: ''
      });
      const [categories, setCategories] = useState([]);
      const [pays, setPays] = useState([]);
      const [villes, setVilles] = useState([]);
      const [devises, setDevises] = useState([]);
      const [mediaFile, setMediaFile] = useState(null);
      const [mediaPreview, setMediaPreview] = useState(null);
      const [isUploading, setIsUploading] = useState(false);

      useEffect(() => {
        const fetchInitialData = async () => {
          const { data: categoriesData, error: categoriesError } = await supabase.from('annonces_categories').select('id, nom');
          if (categoriesError) toast({ title: 'Erreur', description: 'Impossible de charger les catégories.', variant: 'destructive' });
          else setCategories(categoriesData);
          
          const { data: paysData, error: paysError } = await supabase.from('pays').select('id, nom');
          if (paysError) toast({ title: 'Erreur', description: 'Impossible de charger les pays.', variant: 'destructive' });
          else setPays(paysData);

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

      const fetchVilles = useCallback(async (paysId) => {
        if (!paysId) {
          setVilles([]);
          return;
        }
        const { data, error } = await supabase.from('villes').select('id, nom').eq('pays_id', paysId);
        if (error) {
          toast({ title: 'Erreur', description: 'Impossible de charger les villes.', variant: 'destructive' });
        } else {
          setVilles(data);
        }
      }, []);


      const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (id === 'pays_id') {
          fetchVilles(value);
          setFormData(prev => ({ ...prev, ville_id: '' }));
        }
      };

      const handleMediaChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setMediaFile(file);

        if (file.type.startsWith('image')) {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          try {
            const compressedFile = await imageCompression(file, options);
            setMediaPreview(URL.createObjectURL(compressedFile));
            setMediaFile(compressedFile); 
          } catch (error) {
            console.error("Erreur de compression d'image", error);
            setMediaPreview(URL.createObjectURL(file));
          }
        } else {
          setMediaPreview(URL.createObjectURL(file));
        }
      };

      const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
      };
      
      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
          toast({ title: 'Erreur', description: 'Vous devez être connecté pour publier.', variant: 'destructive' });
          return;
        }
        if (!formData.categorie_id || !formData.pays_id || !formData.ville_id || !formData.devise_id) {
          toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' });
          return;
        }
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (formData.telephone && !phoneRegex.test(formData.telephone)) {
            toast({ title: 'Format invalide', description: 'Veuillez entrer un numéro de téléphone valide au format international (ex: +33612345678).', variant: 'destructive' });
            return;
        }
        
        setIsUploading(true);
        let mediaPath = null;
        let mediaType = null;

        try {
          if (mediaFile) {
            const fileExt = mediaFile.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage.from('annonces').upload(filePath, mediaFile);
            if (uploadError) throw uploadError;
            
            mediaPath = uploadData.path;
            mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
          }

          const { error } = await supabase.from('annonces').insert([{ 
            titre: formData.titre,
            categorie_id: formData.categorie_id,
            prix: formData.prix ? parseFloat(formData.prix) : null,
            devise_id: formData.devise_id,
            pays_id: formData.pays_id,
            ville_id: formData.ville_id,
            telephone: formData.telephone,
            email: formData.email,
            description: formData.description,
            user_id: user.id,
            media_url: mediaPath,
            media_type: mediaType,
          }]);
          
          if (error) throw error;
          
          toast({ title: 'Succès !', description: 'Votre annonce a été publiée.' });
          navigate('/annonces');

        } catch (error) {
          toast({ title: 'Erreur de publication', description: error.message, variant: 'destructive' });
        } finally {
          setIsUploading(false);
        }
      };

      return (
        <>
          <Helmet><title>Publier une Annonce - OneKamer.co</title></Helmet>
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
              <h1 className="text-3xl font-bold text-[#2BA84A] mb-6">Publier une annonce</h1>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader><CardTitle>Détails de l'annonce</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="titre">Titre de l'annonce</Label>
                      <Input id="titre" placeholder="Ex: iPhone 13 Pro en excellent état" required value={formData.titre} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categorie_id">Catégorie</Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select id="categorie_id" value={formData.categorie_id} onChange={handleInputChange} className="pl-10 flex h-10 w-full rounded-md border border-[#2BA84A]/30 bg-white px-3 py-2 text-sm" required>
                          <option value="" disabled>Sélectionner une catégorie</option>
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nom}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prix">Prix</Label>
                        <div className="relative">
                          <Input id="prix" type="number" min="0" step="0.01" placeholder="Ex: 29.99" value={formData.prix} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="devise_id">Devise</Label>
                        <div className="relative">
                          <select id="devise_id" value={formData.devise_id} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-[#2BA84A]/30 bg-white px-3 py-2 text-sm" required>
                            <option value="" disabled>Choisir</option>
                            {devises.map(d => <option key={d.id} value={d.id}>{d.nom} ({d.symbole})</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pays_id">Pays</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <select id="pays_id" value={formData.pays_id} onChange={handleInputChange} className="pl-10 flex h-10 w-full rounded-md border border-[#2BA84A]/30 bg-white px-3 py-2 text-sm" required>
                                    <option value="" disabled>Sélectionner un pays</option>
                                    {pays.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ville_id">Ville</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <select id="ville_id" value={formData.ville_id} onChange={handleInputChange} className="pl-10 flex h-10 w-full rounded-md border border-[#2BA84A]/30 bg-white px-3 py-2 text-sm" required disabled={!formData.pays_id || villes.length === 0}>
                                    <option value="" disabled>Sélectionner une ville</option>
                                    {villes.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="telephone">Téléphone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input id="telephone" type="tel" placeholder="+33612345678" pattern="^\+?[1-9]\d{1,14}$" className="pl-10" value={formData.telephone} onChange={handleInputChange} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Format international attendu.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input id="email" type="email" placeholder="contact@email.com" className="pl-10" value={formData.email} onChange={handleInputChange} />
                          </div>
                        </div>
                    </div>
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
                    <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" placeholder="Décrivez votre article ou service en détail..." rows={5} required value={formData.description} onChange={handleInputChange} /></div>
                    <Button type="submit" className="w-full bg-[#E0222A] hover:bg-[#E0222A]/90" disabled={isUploading}>
                      {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publication...</> : "Publier l'annonce"}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </motion.div>
          </div>
        </>
      );
    };

    export default CreateAnnonce;
  