import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coins, Loader2, Send, Gift, BarChart, Gem, UserCheck as UserSearch } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { getUserIdByInput } from '@/lib/okcHelpers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const OKCoins = () => {
  const { user, profile, balance, refreshBalance } = useAuth();
  const [packs, setPacks] = useState([]);
  const [levels, setLevels] = useState([]);
  const [topDonors, setTopDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [donationData, setDonationData] = useState({ receiverInput: '', amount: '', message: '' });
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [buyingPackId, setBuyingPackId] = useState(null);
  
  const [receiverSuggestions, setReceiverSuggestions] = useState([]);
  const [isSearchingReceiver, setIsSearchingReceiver] = useState(false);
  const debounceTimeout = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [packsRes, levelsRes, donorsRes] = await Promise.all([
      supabase.from('okcoins_packs').select('*').eq('is_active', true).order('price_eur'),
      supabase.from('okcoins_levels').select('*').order('id'),
      supabase.from('okcoins_users_balance').select('user_id, donor_level, points_total, profiles(username)').order('points_total', { ascending: false }).limit(3)
    ]);
    
    if (packsRes.error || levelsRes.error || donorsRes.error) {
      toast({ title: "Erreur de chargement", description: "Impossible de récupérer les données OK Coins.", variant: "destructive" });
    } else {
      setPacks(packsRes.data);
      setLevels(levelsRes.data);
      setTopDonors(donorsRes.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReceiverSearch = (searchTerm) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (!searchTerm.trim()) {
      setReceiverSuggestions([]);
      setIsSearchingReceiver(false);
      return;
    }

    setIsSearchingReceiver(true);
    debounceTimeout.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email')
        .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .neq('id', user.id) // Exclude self
        .limit(5);

      if (error) {
        console.error("Erreur de recherche:", error);
      } else {
        setReceiverSuggestions(data);
      }
      setIsSearchingReceiver(false);
    }, 500);
  };
  
  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    if (!user || !profile) {
      return toast({ title: "Veuillez vous connecter", variant: "destructive" });
    }

    const amount = parseInt(donationData.amount);
    if (!donationData.receiverInput || !amount || amount <= 0) {
      return toast({ title: "Données invalides", description: "Veuillez renseigner un destinataire et un montant valide.", variant: "destructive" });
    }

    if (!balance || balance.coins_balance < amount) {
      return toast({ title: "Solde insuffisant", description: "Vous n'avez pas assez de pièces.", variant: "destructive" });
    }

    setIsSubmitting(true);
    try {
      const receiverId = await getUserIdByInput(donationData.receiverInput);

      if (receiverId === user.id) {
        throw new Error("Vous ne pouvez pas vous envoyer de pièces à vous-même.");
      }

      const { error: rpcError } = await supabase.rpc('make_donation', {
        sender: user.id,
        receiver: receiverId,
        amount: amount,
        msg: donationData.message
      });
      
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      
      const postContent = `🎉 ${profile.username} a fait un don de ${amount} OK Coins à ${donationData.receiverInput} ! Merci pour cette générosité qui fait vivre la communauté. 💚`;

      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        content: postContent,
        likes_count: 0,
        comments_count: 0
      });

      if (postError) {
        console.warn("Le don a réussi, mais la publication automatique a échoué:", postError.message);
        toast({ title: "Don envoyé !", description: `La publication automatique a échoué, mais votre don de ${amount} pièces a bien été envoyé.`, variant: "default" });
      } else {
        toast({ title: "Don envoyé et publié !", description: `Vous avez envoyé ${amount} pièces. Merci !` });
      }

      await refreshBalance();
      fetchData(); // Refresh top donors
      setShowDonationDialog(false);
      setDonationData({ receiverInput: '', amount: '', message: '' });

    } catch (error) {
       toast({ title: "Erreur de don", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleBuyPack = async (pack) => {
    if (!user) return toast({ title: "Veuillez vous connecter", variant: "destructive" });
    
    setBuyingPackId(pack.id);
    try {
      const response = await fetch('https://onekamer-server.onrender.com/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packId: pack.id, userId: user.id }),
      });

      const session = await response.json();

      if (!response.ok) {
        throw new Error(session.error || 'Une erreur est survenue.');
      }

      if (session.url) {
        window.location.href = session.url;
      }

    } catch (error) {
      toast({
        title: "Erreur de paiement",
        description: error.message || "Impossible de contacter le serveur de paiement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setBuyingPackId(null);
    }
  };


  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    if (!user || !balance) {
      return toast({ title: "Veuillez vous connecter", variant: "destructive" });
    }

    const amount = parseInt(withdrawalAmount);
    if (!amount || amount < 1000) {
      return toast({ title: "Montant invalide", description: "Le montant minimum de retrait est de 1000 pièces.", variant: "destructive" });
    }

    if (balance.coins_balance < amount) {
      return toast({ title: "Solde insuffisant", description: "Vous n'avez pas assez de pièces pour ce retrait.", variant: "destructive" });
    }
    
    setIsSubmittingWithdrawal(true);
    // TODO: Implement withdrawal logic (e.g., API call to backend)
    setTimeout(() => {
        toast({ title: "Demande reçue", description: `Votre demande de retrait de ${amount} pièces est en cours de traitement. Vous serez notifié.` });
        setShowWithdrawalDialog(false);
        setWithdrawalAmount('');
        setIsSubmittingWithdrawal(false);
    }, 2000);
  };


  const getCurrentLevel = useCallback(() => {
    if (!balance || levels.length === 0) return levels[0] || {};
    return levels.find(l => balance.points_total >= l.min_points && balance.points_total <= l.max_points) || levels[0];
  }, [balance, levels]);
  
  const getLevelById = useCallback((levelId) => {
    return levels.find(l => l.id === levelId) || {};
  }, [levels]);

  const currentLevel = getCurrentLevel();
  const nextLevel = levels.find(l => l.id === (currentLevel?.id || 0) + 1);
  const progress = nextLevel && currentLevel && balance
    ? Math.max(0, Math.min(100, ((balance.points_total - currentLevel.min_points) / (nextLevel.min_points - currentLevel.min_points)) * 100))
    : balance && !nextLevel ? 100 : 0;

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#2BA84A]" /></div>;
  }

  return (
    <>
      <Helmet>
        <title>OK Coins - OneKamer.co</title>
        <meta name="description" content="Soutenez la communauté avec les OK Coins sur OneKamer.co" />
      </Helmet>

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#F5C300] to-[#2BA84A] bg-clip-text text-transparent mb-4">OK Coins 💰</h1>
          <p className="text-lg text-[#6B6B6B]">Soutenez la communauté avec les pièces virtuelles</p>
        </motion.div>

        <Card>
          <CardContent className="p-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-[#2BA84A]" />
                    <span className="font-semibold">Soutenez la communauté</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8">
                  <p className="text-sm text-gray-600">
                    Les dons OK Coins permettent de soutenir les créateurs, les membres et les projets de la communauté OneKamer. Chaque don effectué aide à maintenir la plateforme, récompenser les contributions et faire grandir notre réseau.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    <BarChart className="h-5 w-5 text-[#2BA84A]" />
                    <span className="font-semibold">Comment ça marche ?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8 space-y-2">
                  <p>1. <strong>Rechargez</strong> votre solde en OK Coins (pièces virtuelles) depuis votre compte.</p>
                  <p>2. <strong>Envoyez</strong> un don à un membre, un créateur ou une publication.</p>
                  <p>3. Les bénéficiaires reçoivent des points et peuvent ensuite <strong>convertir</strong> leurs pièces en récompenses ou avantages.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    <Gem className="h-5 w-5 text-[#2BA84A]" />
                    <span className="font-semibold">Niveaux & Points</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8 space-y-3">
                  <p className="font-semibold">À chaque fois que vous offrez des pièces, vous montez en points et débloquez des niveaux :</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Niveau 1 (0-30 pts):</strong> 🪙</li>
                    <li><strong>Niveau 2 (31-60 pts):</strong> 💳</li>
                    <li><strong>Niveau 3 (61-90 pts):</strong> 💶</li>
                    <li><strong>Niveau 4 (91-120 pts):</strong> 💰</li>
                    <li><strong>Niveau 5 (121+ pts):</strong> 💎</li>
                  </ul>
                   <p className="text-xs text-gray-500 pt-2">Toutes les transactions sont instantanées et sécurisées grâce à notre partenaire de paiement Stripe.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {user && balance && (
          <Card className="bg-gradient-to-br from-[#CDE1D5] to-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Votre Niveau</span>
                <span className="text-4xl">{currentLevel?.icon}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold text-[#2BA84A]">{currentLevel?.level_name}</div>
                  <div className="text-sm text-[#6B6B6B]">{balance.points_total || 0} points</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#F5C300]">{balance.coins_balance?.toLocaleString() || 0} 🪙</div>
                  <div className="text-sm text-[#6B6B6B]">Pièces</div>
                </div>
              </div>
              {nextLevel && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progression vers {nextLevel.min_points - (balance.points_total || 0)} points restants</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-[#2BA84A] to-[#F5C300]" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Acheter des pièces</CardTitle>
            <CardDescription>Chaque don effectué vous rapporte des points et vous permet de monter de niveau.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {packs.map((pack) => {
                let coinColorClass = 'text-[#6B6B6B]';
                if (pack.price_eur <= 25) {
                  coinColorClass = 'text-amber-700';
                } else if (pack.price_eur <= 50) {
                  coinColorClass = 'text-gray-400';
                } else if (pack.price_eur <= 100) {
                  coinColorClass = 'text-yellow-500';
                } else {
                  coinColorClass = 'text-blue-400';
                }

                return (
                <motion.div key={pack.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className="text-center cursor-pointer hover:border-[#2BA84A] transition-colors flex flex-col h-full">
                    <CardContent className="pt-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className={`text-3xl mb-2 ${coinColorClass}`}>
                           🪙
                        </div>
                        <div className="font-bold text-lg">{pack.price_eur}€</div>
                        <div className="text-sm text-[#6B6B6B] mb-2">{pack.coins.toLocaleString()} pièces</div>
                        <div className="text-xs text-[#2BA84A] font-semibold">+{pack.points} points</div>
                      </div>
                      <Button className="w-full mt-4 bg-[#2BA84A]" onClick={() => handleBuyPack(pack)} disabled={buyingPackId === pack.id}>
                        {buyingPackId === pack.id ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Acheter'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )})}
            </div>
          </CardContent>
        </Card>

        {user && (
          <Dialog open={showDonationDialog} onOpenChange={(isOpen) => { setShowDonationDialog(isOpen); if (!isOpen) setReceiverSuggestions([]); }}>
            <DialogTrigger asChild>
              <Button className="w-full bg-[#2BA84A] py-6 text-lg"><Send className="h-5 w-5 mr-2" />Faire un don</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleDonationSubmit}>
                <DialogHeader>
                  <DialogTitle>Faire un don 💸</DialogTitle>
                  <DialogDescription>Envoyez des pièces à un autre membre pour le remercier.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="relative">
                    <Label htmlFor="receiverInput" className="text-left mb-2 block">Destinataire</Label>
                    <div className="relative">
                      <Input 
                        id="receiverInput" 
                        value={donationData.receiverInput} 
                        onChange={(e) => {
                          setDonationData(p => ({...p, receiverInput: e.target.value}));
                          handleReceiverSearch(e.target.value);
                        }} 
                        className="pl-10" 
                        placeholder="Pseudo ou email" 
                        autoComplete="off"
                      />
                      <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {(isSearchingReceiver || receiverSuggestions.length > 0) && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {isSearchingReceiver && receiverSuggestions.length === 0 ? (
                           <div className="p-3 text-sm text-gray-500 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin mr-2"/> Recherche...</div>
                        ) : (
                          receiverSuggestions.map(suggestion => (
                            <div 
                              key={suggestion.email}
                              onClick={() => {
                                setDonationData(p => ({...p, receiverInput: suggestion.username}));
                                setReceiverSuggestions([]);
                              }}
                              className="p-3 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                              <p className="font-semibold">{suggestion.username}</p>
                              <p className="text-xs text-gray-500">{suggestion.email}</p>
                            </div>
                          ))
                        )}
                        { !isSearchingReceiver && receiverSuggestions.length === 0 && donationData.receiverInput && (
                           <div className="p-3 text-sm text-center text-gray-500">Aucun utilisateur trouvé.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="amount" className="text-left mb-2 block">Montant</Label>
                    <Input id="amount" type="number" value={donationData.amount} onChange={e => setDonationData(p => ({...p, amount: e.target.value }))} placeholder="Nombre de pièces" />
                  </div>
                   <div>
                    <Label htmlFor="message" className="text-left mb-2 block">Message (optionnel)</Label>
                    <Input id="message" value={donationData.message} onChange={e => setDonationData(p => ({...p, message: e.target.value }))} placeholder="Message d'encouragement..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Envoyer le don
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Top Donateurs 🏆</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDonors.length > 0 ? (
                topDonors.map((donor, index) => {
                  const donorLevel = getLevelById(donor.donor_level);
                  return (
                    <div key={donor.user_id} className="flex items-center justify-between p-3 bg-[#CDE1D5] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-[#2BA84A]">#{index + 1}</div>
                        <div>
                          <div className="font-semibold">{donor.profiles?.username || 'Anonyme'}</div>
                          <div className="text-sm text-[#6B6B6B]">{donor.points_total} points</div>
                        </div>
                      </div>
                      <div className="text-3xl">{donorLevel?.icon || '🪙'}</div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-gray-500">Soyez le premier donateur !</p>
              )}
            </div>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Retrait en cash</CardTitle>
            <CardDescription>Convertissez vos pièces en argent réel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-[#CDE1D5] p-4 rounded-lg space-y-2">
              <div className="flex justify-between"><span className="font-medium">Minimum:</span><span>1 000 pièces</span></div>
              <div className="flex justify-between"><span className="font-medium">Commission:</span><span>10%</span></div>
              <div className="flex justify-between"><span className="font-medium">Taux:</span><span>0,01€/pièce</span></div>
            </div>
            <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-[#E0222A]" disabled={!user}>
                  Demander un retrait
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleWithdrawalSubmit}>
                  <DialogHeader>
                    <DialogTitle>Demander un retrait</DialogTitle>
                    <DialogDescription>Convertissez vos pièces en argent. Le solde sera mis à jour après validation.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="withdrawalAmount" className="text-right">Montant</Label>
                      <Input id="withdrawalAmount" type="number" value={withdrawalAmount} onChange={e => setWithdrawalAmount(e.target.value)} className="col-span-3" placeholder="Nombre de pièces" min="1000" />
                    </div>
                    <div className="text-sm text-muted-foreground col-span-4 text-center">Votre solde: {balance?.coins_balance?.toLocaleString() || 0} pièces</div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmittingWithdrawal}>
                      {isSubmittingWithdrawal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmer la demande
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default OKCoins;