import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Shield, Award, MessageSquare as MessageSquareQuote, Gem, Star, Crown, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MediaDisplay from '@/components/MediaDisplay';

const Badge = ({ icon, label, colorClass }) => (
  <div className={`flex items-center gap-2 py-1 px-3 rounded-full text-sm font-semibold ${colorClass}`}>
    {icon}
    <span>{label}</span>
  </div>
);

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { fetchProfile } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const userProfile = await fetchProfile(userId);
      setProfile(userProfile);
      setLoading(false);
    };
    loadProfile();
  }, [userId, fetchProfile]);

  const handleFollow = () => {
    toast({
      title: `Vous suivez maintenant ${profile?.full_name || 'cet utilisateur'}`,
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée.",
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#2BA84A]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p>Profil non trouvé.</p>
        <Button onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }
  
  const planColors = {
    'Free': 'bg-gray-200 text-gray-800',
    'Standard': 'bg-blue-100 text-blue-800',
    'VIP': 'bg-yellow-200 text-yellow-800',
  };

  return (
    <>
      <Helmet>
        <title>Profil de {profile.username || 'Utilisateur'} - OneKamer.co</title>
      </Helmet>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {profile.avatar_url ? (
                  <MediaDisplay bucket="avatars" path={profile.avatar_url} alt="Avatar" className="w-32 h-32 rounded-full object-cover mb-4" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#2BA84A] to-[#F5C300] flex items-center justify-center text-white text-5xl font-bold mb-4">
                    {(profile.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <h1 className="text-3xl font-bold text-gray-800">{profile.username || 'Utilisateur'}</h1>
                
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge 
                    icon={<Gem className="h-4 w-4" />} 
                    label={`Niveau ${profile.level || 1} - ${profile.levelName || 'Bronze'}`}
                    colorClass="bg-purple-100 text-purple-800"
                  />
                  <Badge 
                    icon={<Crown className="h-4 w-4" />} 
                    label={profile.plan || 'Free'}
                    colorClass={planColors[profile.plan || 'Free']}
                  />
                  {profile.isTopDonor && (
                    <Badge 
                      icon={<Award className="h-4 w-4" />} 
                      label="Top Donateur"
                      colorClass="bg-green-100 text-green-800"
                    />
                  )}
                  {profile.isTopCommenter && (
                    <Badge 
                      icon={<MessageSquareQuote className="h-4 w-4" />} 
                      label="Top Commentateur"
                      colorClass="bg-indigo-100 text-indigo-800"
                    />
                  )}
                  {profile.roles?.map(role => (
                     <Badge 
                      key={role}
                      icon={role === 'Modérateur' ? <Shield className="h-4 w-4" /> : <Star className="h-4 w-4" />} 
                      label={role}
                      colorClass="bg-red-100 text-red-800"
                    />
                  ))}
                </div>

                <p className="text-gray-600 mt-6 max-w-md">{profile.bio || 'Aucune biographie.'}</p>

                <div className="flex gap-4 mt-6">
                  <Button className="bg-[#2BA84A]" onClick={handleFollow}>
                    <Plus className="h-4 w-4 mr-2" />
                    Suivre
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default UserProfile;