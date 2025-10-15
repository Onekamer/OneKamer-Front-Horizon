import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_URL = 'https://onekamer-server.onrender.com';

const Forfaits = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleChoosePlan = async (plan) => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour choisir un forfait.", variant: "destructive" });
      navigate('/auth');
      return;
    }

    setLoadingPlan(plan.key);

    try {
      let response;
      if (plan.key === 'free') {
        toast({ title: "Déjà sur le plan gratuit", description: "Vous utilisez déjà le plan gratuit.", variant: "info" });
        setLoadingPlan(null);
        return;
      }
      
      response = await fetch(`${API_URL}/create-subscription-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, planKey: plan.key, priceId: plan.priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue.');
      }
      
      if (data.url) {
        window.location.href = data.url;
      }

    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter votre demande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      key: 'free',
      name: 'Gratuit',
      description: 'Découvrez les bases de la communauté OneKamer.',
      price: '0€',
      priceId: null,
      features: [
        '📰 Accès aux Annonces (lecture)',
        '🎟️ Accès aux Événements (lecture)',
        '💬 Accès aux Échanges (lecture + commentaires)',
        '🗞️ Accès aux Faits divers',
        '👥 Accès aux Groupes (lecture)',
      ],
    },
    {
      key: 'standard',
      name: 'Standard',
      description: 'Moins cher qu’une portion de soya bien pimenté.',
      price: '2€',
      priceId: 'price_1S6UwbGDT7i4b3lHZCiI9jwh', // Remplacez par le vrai Price ID de Stripe pour 2€
      isPopular: true,
      features: [
        '✅ Tout du plan Gratuit',
        '🏢 Accès aux Partenaires & Recommandations',
        '🏷️ Badge Standard sur le profil',
      ],
    },
    {
      key: 'vip',
      name: 'VIP',
      description: 'À peine le prix de deux courses en moto-taxi.',
      price: '5€',
      priceId: 'price_1S6V5XGDT7i4b3lHcqu6yoZh', // Remplacez par le vrai Price ID de Stripe pour 5€
      features: [
        '✅ Tout du plan Standard',
        '❤️ Accès complet à la section Rencontre',
        '✍️ Création d’annonces',
        '🎉 Création d’événements',
        '👨‍👩‍👧‍👦 Création de groupes',
        '💎 Badge VIP sur le profil',
      ],
    }
  ];

  return (
    <>
      <Helmet>
        <title>Forfaits - OneKamer.co</title>
        <meta name="description" content="Choisissez un forfait pour profiter de toutes les fonctionnalités de OneKamer.co." />
      </Helmet>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#2BA84A]">Nos Forfaits</h1>
          <p className="text-lg text-gray-600 mt-2">Accédez à plus de fonctionnalités et soutenez la communauté.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.key} className={`flex flex-col ${plan.isPopular ? 'border-2 border-[#2BA84A]' : ''} ${profile?.plan === plan.key ? 'bg-green-50' : ''}`}>
              {plan.isPopular && <div className="absolute top-0 right-4 -mt-3 bg-[#2BA84A] text-white text-xs font-bold px-3 py-1 rounded-full">POPULAIRE</div>}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="italic">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-3xl font-bold">{plan.price} <span className="text-sm font-normal">/ mois</span></p>
                  <ul className="space-y-2 text-sm mt-4">
                    {plan.features?.map(feat => <li key={feat} className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> {feat}</li>)}
                    {plan.nonFeatures?.map(feat => <li key={feat} className="flex items-center"><XCircle className="h-4 w-4 mr-2 text-red-500" /> {feat}</li>)}
                  </ul>
                </div>
                <Button 
                  onClick={() => handleChoosePlan(plan)}
                  className={`w-full mt-4 ${profile?.plan === plan.key ? 'bg-gray-400' : (plan.key === 'vip' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-[#2BA84A] hover:bg-[#24903f]')}`}
                  variant={'default'}
                  disabled={loadingPlan === plan.key || profile?.plan === plan.key}
                >
                  {loadingPlan === plan.key ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                   profile?.plan === plan.key ? 'Votre plan actuel' : 
                   plan.key === 'free' ? 'Gratuit' : 
                   plan.key === 'standard' ? 'Souscrire au forfait Standard' : 
                   'Devenir membre VIP'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default Forfaits;