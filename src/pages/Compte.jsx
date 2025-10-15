import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ChevronRight, Coins, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import MediaDisplay from '@/components/MediaDisplay';

const Compte = () => {
  const { user, profile, signOut, balance, loading } = useAuth();
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur OneKamer.co !",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Mon Compte - OneKamer.co</title>
        <meta name="description" content="Gérez votre profil, vos forfaits et vos paramètres sur OneKamer.co." />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-24 h-24 border-4 border-[#2BA84A]">
            {profile.avatar_url ? (
              <MediaDisplay
                bucket="avatars"
                path={profile.avatar_url}
                alt={profile.username}
                className="rounded-full w-full h-full object-cover"
              />
            ) : (
               <AvatarFallback className="text-3xl bg-gray-200">{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
           <p className="text-center text-gray-600 max-w-md">{profile.bio || "Aucune biographie pour le moment."}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mes Badges</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
             <div className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3"/> Niveau 1 - Bronze
            </div>
             <div className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3"/> {profile.plan || 'Free'}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="text-lg">Forfait</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold text-[#2BA84A] capitalize">{profile.plan || 'Free'}</p>
                </CardContent>
            </Card>
            <Card className="text-center cursor-pointer" onClick={() => navigate('/ok-coins')}>
                <CardHeader>
                    <CardTitle className="text-lg">OK Coins</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold text-[#F5C300] flex items-center justify-center gap-2">
                      <Coins className="w-6 h-6"/> {balance ? balance.coins_balance.toLocaleString() : 0}
                    </p>
                </CardContent>
            </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <MenuItem onClick={() => navigate('/compte/modifier')} title="Modifier le profil" />
            <MenuItem onClick={() => navigate('/compte/notifications')} title="Notifications" />
            <MenuItem onClick={() => navigate('/compte/favoris')} title="Mes favoris" />
            <MenuItem onClick={() => navigate('/compte/confidentialite')} title="Confidentialité" />
            <MenuItem onClick={() => navigate('/forfaits')} title="Changer de forfait" />
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="destructive" onClick={handleLogout} className="w-full max-w-sm">
            <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
          </Button>
        </div>
      </div>
    </>
  );
};

const MenuItem = ({ onClick, title }) => (
  <button onClick={onClick} className="w-full flex justify-between items-center py-4 text-left">
    <span className="font-medium">{title}</span>
    <ChevronRight className="h-5 w-5 text-gray-400" />
  </button>
);

export default Compte;
