import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import MediaDisplay from '@/components/MediaDisplay';

const ModifierProfil = () => {
  const { user, profile, updateUser, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPath, setAvatarPath] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setPhone(profile.phone_number || '');
      setBio(profile.bio || '');
      setAvatarPath(profile.avatar_url || null);
    }
  
    if (user) {
      setEmail(user.email || '');
    }
  }, [user, profile]);

  const handleAvatarUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file || !user) return;
  
      setUploading(true);
  
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url;
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }
  
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;
  
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
  
      if (uploadError) throw uploadError;

      const newPath = uploadData.path;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newPath, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setAvatarPath(newPath);
      await refreshProfile();
  
      toast({
        title: 'Photo mise à jour !',
        description: 'Votre nouvel avatar a été enregistré avec succès 🎉',
      });
    } catch (error) {
      console.error('Erreur upload avatar:', error.message);
      toast({
        title: 'Erreur lors du téléchargement',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        username: username,
        bio: bio,
        phone_number: phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      toast({ title: 'Erreur', description: profileError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    
    const updates = {};
    if (email !== user.email) {
      updates.email = email;
    }
    if (password) {
      if (password !== confirmPassword) {
        toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
        setLoading(false);
        return;
      }
      updates.password = password;
    }

    if (Object.keys(updates).length > 0) {
      const { error: authError } = await updateUser(updates);
      if (authError) {
        setLoading(false);
        return;
      }
    }

    await refreshProfile();

    toast({
      title: "✅ Profil mis à jour avec succès.",
      description: "Vos informations ont été enregistrées.",
    });
    setPassword('');
    setConfirmPassword('');
    setLoading(false);
    navigate('/compte');
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#2BA84A]" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Modifier le Profil - OneKamer.co</title>
      </Helmet>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate('/compte')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au compte
          </Button>
          <h1 className="text-3xl font-bold text-[#2BA84A] mb-6">Modifier le profil</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Vos informations</CardTitle>
              <CardDescription>Mettez à jour vos informations personnelles et de connexion.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24">
                     {avatarPath ? (
                        <MediaDisplay bucket="avatars" path={avatarPath} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2BA84A] to-[#F5C300] flex items-center justify-center text-white text-4xl font-bold">
                          {(username || fullName || email)?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    <Button 
                      type="button" 
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full"
                      onClick={() => fileInputRef.current.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </div>
                   <div className="flex-grow">
                     <h2 className="font-bold text-lg">{username || fullName}</h2>
                     <p className="text-sm text-gray-500">Changer la photo de profil</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Nom d'utilisateur</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33612345678" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} maxLength="200" placeholder="Parlez un peu de vous..." />
                  <p className="text-sm text-gray-500 text-right">{bio.length} / 200</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" />
                </div>
                
                <Card className="bg-red-50 border-red-200">
                    <CardHeader>
                        <CardTitle className="text-lg text-red-800">Changer le mot de passe</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full bg-[#2BA84A]" disabled={loading || uploading}>
                  {loading || uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Enregistrer les modifications
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default ModifierProfil;