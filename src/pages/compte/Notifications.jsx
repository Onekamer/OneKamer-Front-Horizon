import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const Notifications = () => {
  const navigate = useNavigate();

  const showToast = () => {
    toast({
      title: "Fonctionnalité en cours de développement",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais vous pouvez la demander dans votre prochain prompt ! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Notifications - OneKamer</title>
      </Helmet>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate('/compte')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au compte
          </Button>
          <h1 className="text-3xl font-bold text-[#2BA84A] mb-6">Paramètres de notifications</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Gérez vos alertes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Cette section est en cours de construction. Bientôt, vous pourrez choisir exactement comment et quand nous vous contactons.
              </p>
              <Button onClick={showToast} className="w-full bg-[#2BA84A]">
                Me prévenir quand c'est prêt
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Notifications;