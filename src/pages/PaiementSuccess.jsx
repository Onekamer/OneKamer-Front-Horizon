import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const PaiementSuccess = () => {
  const { refreshBalance } = useAuth();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const packId = query.get('packId');

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshBalance();
    }, 2000); // Refresh balance after 2 seconds

    return () => clearTimeout(timer);
  }, [refreshBalance]);

  return (
    <>
      <Helmet>
        <title>Paiement Réussi - OneKamer.co</title>
        <meta name="description" content="Votre paiement a été validé avec succès." />
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <Card className="w-full max-w-md p-4">
          <CardHeader>
            <div className="mx-auto bg-green-100 rounded-full p-4 w-fit">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold mt-4">Paiement validé !</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Merci pour votre achat. Vos OK COINS seront crédités automatiquement dans quelques instants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Si votre solde ne se met pas à jour, vous pouvez l'actualiser manuellement.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={refreshBalance} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser mon solde
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/ok-coins">Retourner aux OK Coins</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default PaiementSuccess;