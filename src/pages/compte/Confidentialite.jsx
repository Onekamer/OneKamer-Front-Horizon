import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ChartePopup from '@/components/ChartePopup';

const Confidentialite = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [showCharte, setShowCharte] = useState(false);

  const showToast = () => {
    toast({
      title: "Fonctionnalité en cours de développement",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais vous pouvez la demander dans votre prochain prompt ! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Confidentialité - OneKamer.co</title>
      </Helmet>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate('/compte')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au compte
          </Button>
          <h1 className="text-3xl font-bold text-[#2BA84A] mb-6">Confidentialité et Données</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Charte Communautaire</CardTitle>
              <CardDescription>Règles et valeurs de notre communauté.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p 
                  className="text-gray-600 underline cursor-pointer hover:text-[#2BA84A] transition-colors"
                  onClick={() => setShowCharte(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowCharte(true)}
                >
                  Charte de la communauté
                </p>
                <div className="flex items-center space-x-2 font-semibold">
                  {profile?.has_accepted_charte ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Oui</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span>Non</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contrôlez vos informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Nous construisons cette section pour vous donner un contrôle total sur vos données. Vous pourrez bientôt gérer la visibilité de votre profil, télécharger vos données, et plus encore.
              </p>
              <Button onClick={showToast} className="w-full bg-[#2BA84A] hover:bg-[#248a3b]">
                Explorer les options (bientôt)
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <ChartePopup show={showCharte} onClose={() => setShowCharte(false)} readOnly={true} />
    </>
  );
};

export default Confidentialite;