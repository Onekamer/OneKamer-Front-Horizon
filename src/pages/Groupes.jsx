
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Mail, Users, Lock } from 'lucide-react';
import { canUserAccess } from '@/lib/accessControl';

const Groupes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    if (user) {
      canUserAccess(user, 'groupes', 'create').then(setCanCreate);
    }
  }, [user]);

  const fetchGroupes = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('view_groupes_accessible').select('*');
    if (searchTerm) {
      query = query.ilike('nom', `%${searchTerm}%`);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching groupes:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les groupes.', variant: 'destructive' });
    } else {
      // Temporary fix for membres_count which is not in the view
      const groupesWithCount = await Promise.all(data.map(async (groupe) => {
        const { count } = await supabase.from('groupes_membres').select('*', { count: 'exact' }).eq('groupe_id', groupe.id);
        return { ...groupe, membres_count: count };
      }));
      setGroupes(groupesWithCount);
    }
    setLoading(false);
  }, [searchTerm, toast]);

  useEffect(() => {
    fetchGroupes();
  }, [fetchGroupes]);

  const handleCreateGroupClick = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (await canUserAccess(user, 'groupes', 'create')) {
      navigate('/groupes/creer');
    } else {
      toast({
        title: "Accès restreint",
        description: "La création de groupe est réservée aux membres Standard et VIP.",
        variant: "destructive",
      });
      navigate("/forfaits");
    }
  };

  return (
    <>
      <Helmet>
        <title>Groupes - OneKamer.co</title>
        <meta name="description" content="Rejoignez ou créez des groupes de discussion sur OneKamer.co." />
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-[#2BA84A]"
          >
            Groupes
          </motion.h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/groupes/invitations')}>
              <Mail className="w-4 h-4 mr-2" /> Invitations
            </Button>
            <Button onClick={handleCreateGroupClick} disabled={!canCreate}>
              {canCreate ? <Plus className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {canCreate ? 'Créer un groupe' : 'Verrouillé'}
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Rechercher un groupe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {groupes.map((groupe, index) => (
              <motion.div
                key={groupe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/groupes/${groupe.id}`)}
                className="cursor-pointer"
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">{groupe.nom}</CardTitle>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{groupe.membres_count || 0} membre{groupe.membres_count > 1 ? 's' : ''}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#6B6B6B]">{groupe.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Groupes;
