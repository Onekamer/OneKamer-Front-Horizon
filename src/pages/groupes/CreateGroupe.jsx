import React, { useState, useEffect, useCallback, useRef } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { useNavigate } from 'react-router-dom';
    import { Card, CardContent } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Switch } from '@/components/ui/switch';
    import { ArrowLeft, Camera, UserPlus, X, Loader2 } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import compressImage from 'browser-image-compression';

    const CreateGroupe = () => {
      const navigate = useNavigate();
      const { user } = useAuth();
      
      const [groupName, setGroupName] = useState('');
      const [description, setDescription] = useState('');
      const [theme, setTheme] = useState('');
      const [isPrivate, setIsPrivate] = useState(true);
      
      const [imageFile, setImageFile] = useState(null);
      const [imagePreview, setImagePreview] = useState(null);
      const fileInputRef = useRef(null);

      const [searchTerm, setSearchTerm] = useState('');
      const [availableMembers, setAvailableMembers] = useState([]);
      const [selectedMembers, setSelectedMembers] = useState([]);
      
      const [loading, setLoading] = useState(false);
      const [searchLoading, setSearchLoading] = useState(false);

      useEffect(() => {
        if (!user) {
          toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour créer un groupe.', variant: 'destructive' });
          navigate('/auth');
        }
      }, [user, navigate, toast]);

      const fetchAvailableMembers = useCallback(async (term) => {
        if (!term) {
          setAvailableMembers([]);
          return;
        }
        setSearchLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .ilike('username', `%${term}%`)
          .not('id', 'eq', user.id)
          .limit(10);
          
        setSearchLoading(false);
        if (error) {
          console.error('Error fetching members:', error);
        } else {
          const nonSelectedMembers = data.filter(
            (member) => !selectedMembers.some((sm) => sm.id === member.id)
          );
          setAvailableMembers(nonSelectedMembers);
        }
      }, [user, selectedMembers]);

      useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
          fetchAvailableMembers(searchTerm);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
      }, [searchTerm, fetchAvailableMembers]);

      const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
        }
      };

      const handleToggleMember = (member) => {
        setSearchTerm('');
        setAvailableMembers([]);
        setSelectedMembers(prev =>
          prev.some(m => m.id === member.id)
            ? prev.filter(m => m.id !== member.id)
            : [...prev, member]
        );
      };
      
      const handleRemoveMember = (memberId) => {
        setSelectedMembers(prev => prev.filter(m => m.id !== memberId));
      };

      const handleCreateGroup = async () => {
        if (!user) {
          toast({ title: 'Non authentifié', variant: 'destructive' });
          return;
        }
        if (!groupName.trim()) {
          toast({ title: 'Nom requis', description: 'Veuillez entrer un nom de groupe.', variant: 'destructive' });
          return;
        }

        if (selectedMembers.length < 2) {
          toast({
            title: 'Membres insuffisants',
            description: 'Un groupe doit contenir au moins 3 personnes (vous + 2 autres membres).',
            variant: 'destructive',
          });
          return;
        }

        setLoading(true);

        let uploadedImageUrl = null;
        if (imageFile) {
          try {
            const compressedFile = await compressImage(imageFile, { maxSizeMB: 1, maxWidthOrHeight: 1080 });
            const filePath = `public/${user.id}-${Date.now()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage.from('groupes').upload(filePath, compressedFile);

            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabase.storage.from('groupes').getPublicUrl(uploadData.path);
            uploadedImageUrl = publicUrlData.publicUrl;

          } catch (error) {
            toast({ title: "Erreur d'upload", description: error.message, variant: 'destructive' });
            setLoading(false);
            return;
          }
        }
        
        const memberIds = selectedMembers.map(m => m.id);

        const { data: groupId, error } = await supabase.rpc('create_group', {
          p_nom: groupName,
          p_description: description,
          p_theme: theme,
          p_image_url: uploadedImageUrl,
          p_membres: memberIds
        });


        if (error) {
          toast({ title: 'Erreur lors de la création', description: error.message, variant: 'destructive' });
          setLoading(false);
          return;
        }

        toast({ title: 'Groupe créé avec succès !' });
        navigate(`/groupes/${groupId}`);
      };

      return (
        <>
          <Helmet>
            <title>Créer un Groupe - OneKamer.co</title>
          </Helmet>
          <div className="max-w-xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <Button variant="ghost" onClick={() => navigate('/groupes')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux groupes
              </Button>
              <h1 className="text-3xl font-bold text-[#2BA84A] mb-6">Créer un nouveau groupe</h1>
            </motion.div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                  <div className="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Aperçu du groupe" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Camera className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Photo du groupe</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-name">Nom du groupe *</Label>
                  <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-description">Description</Label>
                  <Textarea id="group-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="group-theme">Thème</Label>
                  <Input id="group-theme" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ex: Sport, Cuisine..."/>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="privacy-switch">Groupe Privé</Label>
                    <p className="text-sm text-muted-foreground">Seuls les membres peuvent voir le contenu.</p>
                  </div>
                  <Switch id="privacy-switch" checked={isPrivate} onCheckedChange={setIsPrivate} disabled/>
                </div>

                <div className="space-y-4">
                  <Label>Inviter des membres (2 minimum)</Label>
                  {selectedMembers.length > 0 && (
                    <div>
                      <p className="font-semibold mb-2">{selectedMembers.length} membre(s) à inviter</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMembers.map(member => (
                          <div key={member.id} className="flex items-center gap-2 bg-gray-200 rounded-full pl-3 pr-1 py-1 text-sm">
                            <span>{member.username}</span>
                            <button onClick={() => handleRemoveMember(member.id)} className="rounded-full hover:bg-gray-300 p-0.5"><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <Input placeholder="Rechercher par nom d'utilisateur..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    {searchLoading && <Loader2 className="h-5 w-5 animate-spin absolute right-2 top-1/2 -translate-y-1/2"/>}
                  </div>
                  
                  {availableMembers.length > 0 && searchTerm && (
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                      {availableMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100" onClick={() => handleToggleMember(member)}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback>{member.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{member.username}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {availableMembers.length === 0 && searchTerm && !searchLoading && <p className="text-center text-sm text-gray-500 p-2">Aucun utilisateur trouvé.</p>}
                </div>

                <Button onClick={handleCreateGroup} disabled={loading} className="w-full bg-gradient-to-r from-[#2BA84A] to-[#F5C300] text-white font-bold text-lg py-6 rounded-2xl">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Créer le groupe'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      );
    };

    export default CreateGroupe;