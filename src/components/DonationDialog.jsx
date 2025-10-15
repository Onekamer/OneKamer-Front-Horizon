import React, { useState } from 'react';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
      DialogTrigger,
    } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Gift, Loader2 } from 'lucide-react';
    import { motion } from 'framer-motion';

    const DonationDialog = ({ receiverId, receiverName }) => {
      const { user, balance, refreshBalance } = useAuth();
      const { toast } = useToast();
      const [amount, setAmount] = useState('');
      const [message, setMessage] = useState('');
      const [loading, setLoading] = useState(false);
      const [isOpen, setIsOpen] = useState(false);
      const [step, setStep] = useState(1);

      const handleDonation = async () => {
        if (!user) {
          toast({ title: 'Connexion requise', variant: 'destructive' });
          return;
        }

        const donationAmount = parseInt(amount);
        if (isNaN(donationAmount) || donationAmount <= 0) {
          toast({ title: 'Montant invalide', variant: 'destructive' });
          return;
        }

        if (balance.coins_balance < donationAmount) {
          toast({ title: 'Solde insuffisant', description: `Vous n'avez que ${balance.coins_balance} pièces.`, variant: 'destructive' });
          return;
        }

        setLoading(true);
        try {
          const { error } = await supabase.rpc('make_donation', {
            sender: user.id,
            receiver: receiverId,
            amount: donationAmount,
            msg: message || `Un petit don pour toi !`,
          });

          if (error) throw error;

          toast({
            title: 'Don effectué !',
            description: `Vous avez envoyé ${donationAmount} pièces à ${receiverName}.`,
          });
          refreshBalance();
          setAmount('');
          setMessage('');
          setIsOpen(false);
          setStep(1);

        } catch (error) {
          toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      };

      const handleNextStep = () => {
        const donationAmount = parseInt(amount);
        if (isNaN(donationAmount) || donationAmount <= 0) {
          toast({ title: 'Veuillez entrer un montant valide.', variant: 'destructive' });
          return;
        }
        setStep(2);
      };

      const handleOpenChange = (open) => {
        if (!open) {
            setStep(1);
            setAmount('');
            setMessage('');
        }
        setIsOpen(open);
      }

      return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-500 hover:text-[#2BA84A]">
              <Gift className="h-4 w-4" />
              <span className="text-xs">Don</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Faire un don à {receiverName}</DialogTitle>
              <DialogDescription>
                Montrez votre appréciation en envoyant des OKCoins. Vous avez actuellement {balance?.coins_balance || 0} pièces.
              </DialogDescription>
            </DialogHeader>

            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 1 ? 0 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">Montant</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="col-span-3"
                      placeholder="Ex: 100"
                    />
                  </div>
                  <div className="flex justify-center gap-2">
                    {[10, 50, 100, 500].map(val => (
                        <Button key={val} variant="outline" size="sm" onClick={() => setAmount(val.toString())}>
                            {val}
                        </Button>
                    ))}
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="grid gap-4 py-4">
                  <p>Vous êtes sur le point d'envoyer <strong>{amount} pièces</strong> à <strong>{receiverName}</strong>.</p>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="message">Message (optionnel)</Label>
                    <Input 
                      id="message" 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Pour vous remercier..."
                    />
                  </div>
                </div>
              )}
            </motion.div>

            <DialogFooter>
              {step === 1 && <Button onClick={handleNextStep}>Suivant</Button>}
              {step === 2 && (
                <>
                  <Button variant="ghost" onClick={() => setStep(1)}>Précédent</Button>
                  <Button onClick={handleDonation} disabled={loading} className="bg-[#2BA84A]">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirmer le don
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    export default DonationDialog;