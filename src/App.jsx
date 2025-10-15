import React, { useState, useEffect } from 'react';
    import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { Toaster } from '@/components/ui/toaster';
    import Header from '@/components/layout/Header';
    import BottomNav from '@/components/layout/BottomNav';
    import Home from '@/pages/Home';
    import Annonces from '@/pages/Annonces';
    import Partenaires from '@/pages/Partenaires';
    import Echange from '@/pages/Echange';
    import Evenements from '@/pages/Evenements';
    import Rencontre from '@/pages/Rencontre';
    import FaitsDivers from '@/pages/FaitsDivers';
    import Groupes from '@/pages/Groupes';
    import GroupeDetail from '@/pages/GroupeDetail';
    import CreateGroupe from '@/pages/groupes/CreateGroupe';
    import GroupInvitations from '@/pages/groupes/GroupInvitations';
    import OKCoins from '@/pages/OKCoins';
    import Forfaits from '@/pages/Forfaits';
    import Compte from '@/pages/Compte';
    import Publier from '@/pages/Publier';
    import Rechercher from '@/pages/Rechercher';
    import Messages from '@/pages/Messages';
    import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
    import ModifierProfil from '@/pages/compte/ModifierProfil';
    import Notifications from '@/pages/compte/Notifications';
    import Confidentialite from '@/pages/compte/Confidentialite';
    import Favoris from '@/pages/compte/Favoris';
    import CreateAnnonce from '@/pages/publier/CreateAnnonce';
    import CreateEvenement from '@/pages/publier/CreateEvenement';
    import ProposerPartenaire from '@/pages/publier/ProposerPartenaire';
    import UserProfile from '@/pages/UserProfile';
    import RencontreMessages from '@/pages/rencontre/RencontreMessages';
    import ConversationDetail from '@/pages/rencontre/ConversationDetail';
    import RencontreProfil from '@/pages/rencontre/RencontreProfil';
    import AuthPage from '@/pages/Auth';
    import PaiementSuccess from '@/pages/PaiementSuccess';
    import PaiementAnnule from '@/pages/PaiementAnnule';
    import MerciVerification from '@/pages/MerciVerification';
    import VerificationSMS from '@/pages/VerificationSMS';
    import ChartePopup from '@/components/ChartePopup';
    import { useCharteValidation } from '@/hooks/useCharteValidation';
    import { applyAutoAccessProtection } from "@/lib/autoAccessWrapper";

    const AppLayout = () => {
      const { profile } = useAuth();
      const navigate = useNavigate();
      const location = useLocation();

      useEffect(() => {
        if (profile) {
          applyAutoAccessProtection(profile, navigate, location.pathname);
        }
      }, [profile, navigate, location]);

      return null;
    };

    const AppContent = () => {
      const { showCharte, acceptCharte } = useCharteValidation();
      const [deferredPrompt, setDeferredPrompt] = useState(null);

      useEffect(() => {
        const handler = (e) => {
          e.preventDefault();
          setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
      }, []);

      return (
        <>
          <Header deferredPrompt={deferredPrompt} />
          <AppLayout />
          <main className="container mx-auto px-4 pt-20 pb-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/annonces" element={<Annonces />} />
              <Route path="/partenaires" element={<Partenaires />} />
              <Route path="/echange" element={<Echange />} />
              <Route path="/evenements" element={<Evenements />} />
              <Route path="/rencontre" element={<Rencontre />} />
              <Route path="/rencontre/messages" element={<RencontreMessages />} />
              <Route path="/rencontre/messages/:conversationId" element={<ConversationDetail />} />
              <Route path="/rencontre/profil" element={<RencontreProfil />} />
              <Route path="/faits-divers" element={<FaitsDivers />} />
              <Route path="/groupes" element={<Groupes />} />
              <Route path="/groupes/creer" element={<CreateGroupe />} />
              <Route path="/groupes/invitations" element={<GroupInvitations />} />
              <Route path="/groupes/:groupId" element={<GroupeDetail />} />
              <Route path="/ok-coins" element={<OKCoins />} />
              <Route path="/forfaits" element={<Forfaits />} />
              <Route path="/compte" element={<Compte />} />
              <Route path="/compte/modifier" element={<ModifierProfil />} />
              <Route path="/compte/notifications" element={<Notifications />} />
              <Route path="/compte/confidentialite" element={<Confidentialite />} />
              <Route path="/compte/favoris" element={<Favoris />} />
              <Route path="/publier" element={<Publier />} />
              <Route path="/publier/annonce" element={<CreateAnnonce />} />
              <Route path="/publier/evenement" element={<CreateEvenement />} />
              <Route path="/publier/partenaire" element={<ProposerPartenaire />} />
              <Route path="/rechercher" element={<Rechercher />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profil/:userId" element={<UserProfile />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/merci-verification" element={<MerciVerification />} />
              <Route path="/verification-sms" element={<VerificationSMS />} />
              <Route path="/paiement-success" element={<PaiementSuccess />} />
              <Route path="/paiement-annule" element={<PaiementAnnule />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <ChartePopup show={showCharte} onAccept={acceptCharte} />
          <BottomNav />
        </>
      );
    }

    function App() {
      return (
        <AuthProvider>
          <Router>
            <Helmet>
              <title>OneKamer.co - Communauté Camerounaise</title>
              <meta name="description" content="Application communautaire de la diaspora camerounaise - Annonces, Événements, Rencontres et plus" />
              <link rel="manifest" href="/manifest.json" />
              <meta name="theme-color" content="#2BA84A" />
            </Helmet>
            
            <div className="min-h-screen bg-gradient-to-br from-[#FDF9F9] to-[#CDE1D5] pb-20">
              <AppContent />
            </div>

            <Toaster />
          </Router>
        </AuthProvider>
      );
    }

    export default App;