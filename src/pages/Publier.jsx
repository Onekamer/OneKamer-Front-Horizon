
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, MessageSquare, Star, Users, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { canUserAccess } from '@/lib/accessControl';
import { useToast } from '@/components/ui/use-toast';

const Publier = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const options = [
    {
      title: 'Annonce',
      icon: FileText,
      description: 'Vendre, louer ou proposer un service.',
      color: '#E0222A',
      path: '/publier/annonce',
      access: { section: 'annonces', action: 'create' },
    },
    {
      title: 'Événement',
      icon: Calendar,
      description: 'Organiser une rencontre communautaire.',
      color: '#2BA84A',
      path: '/publier/evenement',
      access: { section: 'evenements', action: 'create' },
    },
    {
      title: 'Partenaire',
      icon: Star,
      description: 'Suggérer un nouveau partenaire de confiance.',
      color: '#F9C400',
      path: '/publier/partenaire',
      access: { section: 'partenaires', action: 'create' },
    },
    {
      title: 'Post',
      icon: MessageSquare,
      description: 'Partager un message avec la communauté.',
      color: '#007AFF',
      path: '/echange',
      access: { section: 'echanges', action: 'comment' },
    },
    {
      title: 'Groupe',
      icon: Users,
      description: 'Créer un nouveau groupe de discussion.',
      color: '#9333EA',
      path: '/groupes/creer',
      access: { section: 'groupes', action: 'create' },
    },
  ];

  const [accessRights, setAccessRights] = useState({});

  useEffect(() => {
    if (user) {
      const checkAccess = async () => {
        const rights = {};
        for (const option of options) {
          rights[option.access.section] = await canUserAccess(user, option.access.section, option.access.action);
        }
        setAccessRights(rights);
      };
      checkAccess();
    }
  }, [user]);


  const handleCardClick = async (option) => {
    if (!user) {
        toast({
            title: "Connexion requise",
            variant: "destructive",
        });
        navigate("/auth");
        return;
    }
    const canAccess = await canUserAccess(user, option.access.section, option.access.action);
    if (canAccess) {
      navigate(option.path);
    } else {
      toast({
        title: "Accès restreint",
        description: "Cette fonctionnalité est réservée aux membres disposant d’un forfait supérieur.",
        variant: "destructive",
      });
      navigate("/forfaits");
    }
  };

  return (
    <>
      <Helmet>
        <title>Publier - OneKamer.co</title>
        <meta name="description" content="Publiez du contenu sur OneKamer.co" />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-[#2BA84A] mb-4">Publier</h1>
          <p className="text-[#6B6B6B]">
            Que souhaitez-vous partager avec la communauté ?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option, index) => {
            const hasAccess = accessRights[option.access.section] || false;
            return (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer hover:shadow-lg transition-all h-full flex flex-col ${!hasAccess ? 'opacity-70 bg-gray-50' : 'hover:scale-105'}`}
                  onClick={() => handleCardClick(option)}
                >
                  <CardHeader>
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${option.color}20` }}
                    >
                      <option.icon 
                        className="h-6 w-6"
                        style={{ color: option.color }}
                      />
                    </div>
                    <CardTitle className="flex items-center">
                      {option.title}
                      {!hasAccess && <Lock className="h-4 w-4 ml-2 text-gray-500" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow">
                    <p className="text-[#6B6B6B] mb-4 flex-grow">{option.description}</p>
                    <Button 
                      className="w-full mt-auto text-white"
                      style={{ 
                        backgroundColor: hasAccess ? option.color : '#A0AEC0',
                        cursor: hasAccess ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {hasAccess ? 'Créer' : 'Verrouillé'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <Card className="bg-gradient-to-r from-[#CDE1D5] to-white">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">📝 Note importante</h3>
            <p className="text-sm text-[#6B6B6B]">
              Tout contenu publié est soumis à modération. 
              Merci de respecter les règles de la communauté OneKamer.co.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Publier;
