import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, FileText, TrendingUp, MapPin, Clock, Heart, MessageCircle, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import MediaDisplay from '@/components/MediaDisplay';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const SectionHeader = ({ title, icon: Icon, path, navigate }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <Icon className="h-6 w-6 text-[#2BA84A]" />
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    </div>
    <Button variant="link" className="text-sm font-semibold text-[#2BA84A] hover:underline p-0 h-auto" onClick={() => navigate(path)}>
      Voir tout
    </Button>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [partners, setPartners] = useState([]);
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const fetchPosts = supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(2);

      const fetchEvents = supabase
        .from('evenements')
        .select('*')
        .order('date', { ascending: true })
        .limit(2);

      const fetchPartners = supabase
        .from('partenaires')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2);

      const fetchAnnonces = supabase
        .from('annonces')
        .select('*, devises(symbole)')
        .order('created_at', { ascending: false })
        .limit(2);

      const [
        postsResult,
        eventsResult,
        partnersResult,
        annoncesResult
      ] = await Promise.all([fetchPosts, fetchEvents, fetchPartners, fetchAnnonces]);

      setPosts(postsResult.data || []);
      setEvents(eventsResult.data || []);
      setPartners(partnersResult.data || []);
      setAnnonces(annoncesResult.data || []);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const formatPrice = (price, devise) => {
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
        return 'Gratuit';
    }
    const symbol = devise?.symbole || '€';
    return `${priceNumber.toFixed(2).replace('.', ',')} ${symbol}`;
  };

  return (
    <>
      <Helmet>
        <title>Accueil - OneKamer.co</title>
        <meta name="description" content="Bienvenue sur OneKamer.co, la communauté camerounaise en ligne" />
      </Helmet>

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-left">
          <h1 className="text-3xl font-bold text-[#2BA84A] mb-2 leading-tight">
            Bienvenue sur OneKamer<span className="text-xl font-normal text-[#2BA84A]">.co</span>
          </h1>
          <p className="text-md text-[#6B6B6B]">Le premier repère de la communauté camerounaise qui regroupe tous ses ressortissant(e)s et sa diaspora à travers le monde.</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#2BA84A]" /></div>
        ) : (
          <>
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <SectionHeader title="Tendances Communauté" icon={TrendingUp} path="/echange" navigate={navigate} />
              <div className="space-y-4">
                {posts.map(post => (
                  <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/echange')}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          <MediaDisplay bucket="avatars" path={post.profiles?.avatar_url} alt={post.profiles?.username} className="w-full h-full object-cover" fallback={
                            <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                              {post.profiles?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                          }/>
                        </div>
                        <div className="flex-grow">
                          <p className="font-bold text-sm">{post.profiles?.username}</p>
                          <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}</p>
                          <p className="text-sm text-gray-700 my-2 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 text-gray-500">
                            <span className="flex items-center gap-1 text-xs"><Heart className="h-4 w-4 text-red-500" /> {post.likes_count}</span>
                            <span className="flex items-center gap-1 text-xs"><MessageCircle className="h-4 w-4 text-blue-500" /> {post.comments_count}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <SectionHeader title="Événements à venir" icon={Calendar} path="/evenements" navigate={navigate} />
              <div className="space-y-4">
                {events.map(event => (
                  <Card key={event.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/evenements')}>
                    <MediaDisplay bucket="evenements" path={event.media_url} alt={event.title} className="w-full h-32 object-cover" />
                    <CardContent className="p-4">
                      <h3 className="font-bold text-md mb-2 truncate">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <SectionHeader title="Partenaires" icon={Users} path="/partenaires" navigate={navigate} />
              <div className="grid grid-cols-2 gap-4">
                {partners.map(partner => (
                  <Card key={partner.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/partenaires')}>
                    <CardContent className="p-4 text-center">
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden">
                        <MediaDisplay bucket="partenaires" path={partner.media_url} alt={partner.name} className="w-full h-full object-cover" />
                      </div>
                      <h3 className="font-bold text-sm truncate">{partner.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{partner.address}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <SectionHeader title="Annonces récentes" icon={FileText} path="/annonces" navigate={navigate} />
              <div className="space-y-4">
                {annonces.map(annonce => (
                  <Card key={annonce.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/annonces')}>
                    <MediaDisplay bucket="annonces" path={annonce.media_url} alt={annonce.titre} className="w-full h-32 object-cover" />
                    <CardContent className="p-4">
                      <h3 className="font-bold text-md truncate">{annonce.titre}</h3>
                      <p className="text-lg font-semibold text-[#2BA84A]">{formatPrice(annonce.prix, annonce.devises)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          </>
        )}
      </div>
    </>
  );
};

export default Home;