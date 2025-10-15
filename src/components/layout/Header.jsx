import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, User, Download, Users, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import MediaDisplay from '@/components/MediaDisplay';

const Header = ({ deferredPrompt }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    setShowInstall(!!deferredPrompt);
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-[#2BA84A]/20 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex-shrink-0 w-24 flex justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#2BA84A]">
                <Menu className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/faits-divers')}>
                📰 Faits Divers
              </DropdownMenuItem>
               <DropdownMenuItem onClick={() => navigate('/groupes')}>
                <Users className="mr-2 h-4 w-4" /> Groupes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/publier')}>
                ✍️ Publier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/echange')}>
                💬 Échange Communautaire
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/ok-coins')}>
                💰 Faire un Don (OK Coins)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-grow flex justify-center items-center h-full px-2">
          <Link to="/" className="flex items-center h-full">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-full flex items-center">
              <img src="https://horizons-cdn.hostinger.com/2838c69a-ba17-4f74-8eef-55777dbe8ec3/logo_v2-JTv10.png" alt="OneKamer Logo" className="h-[calc(100%-0.5rem)] w-auto object-contain" />
            </motion.div>
          </Link>
        </div>

        <div className="flex-shrink-0 w-24 flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/rechercher')} className="text-[#2BA84A]">
            <Search className="h-5 w-5" />
          </Button>

          {showInstall && (
            <Button variant="ghost" size="icon" onClick={handleInstall} className="text-[#2BA84A]">
              <Download className="h-5 w-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#2BA84A] rounded-full">
                {user && profile ? (
                  <Avatar className="h-8 w-8">
                    {profile.avatar_url ? (
                      <MediaDisplay
                        bucket="avatars"
                        path={profile.avatar_url}
                        alt={profile.username || 'Avatar'}
                        className="rounded-full w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-sm bg-gray-200">
                        {profile.username ? profile.username.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuItem onClick={() => navigate('/compte')}>
                    <User className="mr-2 h-4 w-4" /> Mon Compte
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/rencontre/profil')}>
                    <Heart className="mr-2 h-4 w-4" /> Mon Profil - Rencontre
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/forfaits')}>
                    💳 Forfaits
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/compte/notifications')}>
                    ⚙️ Paramètres
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => navigate('/auth')}>
                  👤 Connexion / Inscription
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;