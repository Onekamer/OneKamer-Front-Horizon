import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

const Messages = () => {
  return (
    <>
      <Helmet>
        <title>Messages - OneKamer.co</title>
        <meta name="description" content="Vos messages privés sur OneKamer.co" />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-[#2BA84A] mb-4">Messages</h1>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Boîte de réception</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-12">
              <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">Bientôt disponible !</p>
              <p className="text-sm">La messagerie privée arrive très prochainement.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Messages;