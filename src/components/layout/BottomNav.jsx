import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Users, MessageSquare, Calendar, Heart } from 'lucide-react';

const navItems = [
  { path: '/annonces', icon: FileText, label: 'Annonces' },
  { path: '/partenaires', icon: Users, label: 'Partenaires' },
  { path: '/echange', icon: MessageSquare, label: 'Échange', isCentral: true },
  { path: '/evenements', icon: Calendar, label: 'Événements' },
  { path: '/rencontre', icon: Heart, label: 'Rencontre' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const mainNavItems = navItems.filter(item => !item.isCentral);
  const centralItem = navItems.find(item => item.isCentral);

  // Distribute mainNavItems around the central button
  const itemsPerSide = Math.floor(mainNavItems.length / 2);
  const leftItems = mainNavItems.slice(0, itemsPerSide);
  const rightItems = mainNavItems.slice(itemsPerSide);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-24">
      <div
        className="absolute bottom-0 left-0 right-0 h-16 glass-effect border-t border-[#2BA84A]/20 bottom-nav-safe"
      >
        <div className="container mx-auto px-2 h-full">
          <div className="flex items-center justify-around h-full">
            {leftItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex flex-col items-center justify-center flex-1 relative h-full"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`flex flex-col items-center gap-1 transition-colors ${
                      isActive ? 'text-[#2BA84A]' : 'text-[#6B6B6B]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </motion.div>
                  {isActive && (
                    <motion.div
                      layoutId={`activeTab-${path}`}
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#2BA84A] rounded-full"
                    />
                  )}
                </Link>
              );
            })}

            <div className="flex-1" /> {/* Spacer for the central button */}

            {rightItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex flex-col items-center justify-center flex-1 relative h-full"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`flex flex-col items-center gap-1 transition-colors ${
                      isActive ? 'text-[#2BA84A]' : 'text-[#6B6B6B]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </motion.div>
                  {isActive && (
                    <motion.div
                      layoutId={`activeTab-${path}`}
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#2BA84A] rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 flex items-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(centralItem.path)}
          className="w-16 h-16 bg-[#2BA84A] rounded-full flex items-center justify-center shadow-lg border-4 border-white"
        >
          <centralItem.icon className="h-8 w-8 text-white" />
        </motion.button>
      </div>
    </nav>
  );
};

export default BottomNav;