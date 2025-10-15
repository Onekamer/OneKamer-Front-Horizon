import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const PaiementAnnule = () => {
  return (
    <>
      <Helmet>
        <title>Paiement Annulé - OneKamer.co</title>
        <meta name="description" content="Votre paiement a été annulé." />
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <Card className="w-full max-w-md p-4">
          <CardHeader>
            <div className="mx-auto bg-red-100 rounded-full p-4 w-fit">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold mt-4">Paiement annulé</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Votre transaction a été annulée ou a échoué. Vous n'avez pas été débité.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Vous pouvez retourner à la boutique et essayer à nouveau.
            </p>
            <Button asChild className="w-full">
              <Link to="/ok-coins">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default PaiementAnnule;