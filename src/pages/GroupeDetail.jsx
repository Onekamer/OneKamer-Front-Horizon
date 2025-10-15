import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { useParams, useNavigate } from 'react-router-dom';
    import { Card, CardContent } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { ArrowLeft, Users, Send, Paperclip, MoreVertical, Shield, Star, Crown, Trash2, LogOut, Loader2 } from 'lucide-react';
    import { Textarea } from '@/components/ui/textarea';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import MediaDisplay from '@/components/MediaDisplay';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import DonationDialog from '@/components/DonationDialog';
    import { formatDistanceToNow } from 'date-fns';
    import { fr } from 'date-fns/locale';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import GroupMembers from '@/pages/groupes/GroupMembers';
    import GroupAdmin from '@/pages/groupes/GroupAdmin';

    const MessageItem = ({ msg, currentUserId, onReply, onDonate }) => {
      const isMyMessage = msg.sender_id === currentUserId;

      const renderContent = () => {
        try {
          // Check if content is a valid media path (e.g., from an upload)
          const isMedia = msg.contenu.includes('/');
          if (isMedia) {
             return <MediaDisplay bucket="groupes" path={msg.contenu} alt="Média partagé" className="rounded-lg max-h-80 cursor-pointer" />;
          }
        } catch(e) {
          // not a media path
        }
        return <p>{msg.contenu}</p>;
      }

      return (
          <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm mb-4">
              <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarImage src={msg.sender?.avatar_url} />
                              <AvatarFallback>{msg.sender?.username?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-bold">{msg.sender?.username || 'Utilisateur inconnu'}</p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                              </p>
                          </div>
                      </div>
                      {!isMyMessage && <DonationDialog receiverId={msg.sender_id} receiverName={msg.sender?.username} />}
                  </div>
                  <div className="mt-3 pl-12">
                      {renderContent()}
                  </div>
              </CardContent>
          </Card>
      )
    };
    
    const GroupeDetail = () => {
      const { groupId } = useParams();
      const navigate = useNavigate();
      const { user } = useAuth();
      const [group, setGroup] = useState(null);
      const [role, setRole] = useState('guest');
      const [messages, setMessages] = useState([]);
      const [loading, setLoading] = useState(true);
      const [newMessage, setNewMessage] = useState('');
      const messagesEndRef = React.useRef(null);
    
      const memberRole = useMemo(() => {
        if (!group || !user) return 'guest';
        if (group.fondateur_id === user.id) return 'fondateur';
        const member = group.groupes_membres.find(m => m.user_id === user.id);
        if (!member) return 'guest';
        if (member.is_admin) return 'admin';
        return 'membre';
      }, [group, user]);
    
      const fetchGroupData = useCallback(async () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        setLoading(true);

        const { data: groupData, error: groupError } = await supabase
            .from('groupes')
            .select('*')
            .eq('id', groupId)
            .single();

        if (groupError) {
            toast({ title: 'Erreur', description: 'Groupe introuvable ou privé.', variant: 'destructive' });
            navigate('/groupes');
            return;
        }
        
        const { data: membersData, error: membersError } = await supabase
            .from('groupes_membres')
            .select('*, profile:profiles(username, avatar_url)')
            .eq('groupe_id', groupId);

        if (membersError) {
            console.error("Error fetching members:", membersError);
        }

        const fullGroupData = { ...groupData, groupes_membres: membersData || [] };
        setGroup(fullGroupData);

        const currentMemberRole = fullGroupData.fondateur_id === user.id ? 'fondateur' : membersData?.find(m => m.user_id === user.id)?.is_admin ? 'admin' : membersData?.some(m => m.user_id === user.id) ? 'membre' : 'guest';
        setRole(currentMemberRole);

        if (currentMemberRole !== 'guest' || !fullGroupData.est_prive) {
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages_groupes')
                .select('*, sender:sender_id(username, avatar_url)')
                .eq('groupe_id', groupId)
                .order('created_at', { ascending: true });

            if (messagesError) console.error("Error fetching messages", messagesError);
            else setMessages(messagesData || []);
        }

        setLoading(false);
    }, [groupId, user, navigate, toast]);

    
      useEffect(() => {
        fetchGroupData();
      }, [fetchGroupData]);
    
      useEffect(() => {
        if (role === 'guest' && group?.est_prive) return;

        const channel = supabase
          .channel(`group-chat-${groupId}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_groupes', filter: `groupe_id=eq.${groupId}` }, 
            async payload => {
                const { data: sender } = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.sender_id).single();
                setMessages(current => [...current, { ...payload.new, sender }]);
            })
          .subscribe();
    
        return () => supabase.removeChannel(channel);
      }, [groupId, role, group?.est_prive]);

      useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]);
    
      const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        const { error } = await supabase.from('messages_groupes').insert({
          groupe_id: groupId,
          sender_id: user.id,
          contenu: newMessage,
        });
        if (error) toast({ title: 'Erreur', description: 'Impossible d\'envoyer le message.', variant: 'destructive' });
        else setNewMessage('');
      };
    
      if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
      if (!group) return null;

      const memberCount = group.groupes_membres.length;

      const isMember = role !== 'guest';
    
      if (!isMember && group.est_prive) {
        return (
          <>
            <Helmet><title>Rejoindre {group.nom}</title></Helmet>
            <Button variant="ghost" onClick={() => navigate('/groupes')} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button>
            <Card className="text-center">
              <CardContent className="pt-6">
                <MediaDisplay bucket="groupes" path={group.image_url} alt={group.nom} className="w-32 h-32 rounded-full object-cover mx-auto mb-4" />
                <h1 className="text-2xl font-bold">{group.nom}</h1>
                <p className="mt-4">{group.description}</p>
                <Button className="mt-6 bg-[#2BA84A]" onClick={() => toast({ title: "Fonctionnalité à venir", description: "La demande pour rejoindre un groupe sera bientôt disponible."})}>Demander à rejoindre</Button>
              </CardContent>
            </Card>
          </>
        );
      }
    
      return (
        <>
          <Helmet><title>{group.nom} - Groupe OneKamer.co</title></Helmet>
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            <div className="flex items-center p-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/groupes')}><ArrowLeft className="h-5 w-5" /></Button>
              <div className="flex-1 text-center">
                <h1 className="font-bold text-lg">{group.nom}</h1>
                <p className="text-sm text-gray-500">{memberCount} membres</p>
              </div>
              <div className="w-10"></div>
            </div>
            
            <Tabs defaultValue="messages" className="flex-grow flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mx-auto max-w-md">
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="members">Membres</TabsTrigger>
                {(role === 'admin' || role === 'fondateur') && <TabsTrigger value="admin">Admin</TabsTrigger>}
              </TabsList>

              <TabsContent value="messages" className="flex-grow overflow-y-auto p-4 space-y-2">
                {messages.map(msg => <MessageItem key={msg.id} msg={msg} currentUserId={user.id} />)}
                <div ref={messagesEndRef}></div>
              </TabsContent>

              <TabsContent value="members" className="flex-grow overflow-y-auto p-4">
                <GroupMembers members={group.groupes_membres} currentUserRole={role} currentUserId={user.id} groupId={group.id} onMemberUpdate={fetchGroupData} />
              </TabsContent>

              {(role === 'admin' || role === 'fondateur') && (
                <TabsContent value="admin" className="flex-grow overflow-y-auto p-4">
                  <GroupAdmin group={group} onGroupUpdate={fetchGroupData}/>
                </TabsContent>
              )}
            </Tabs>
    
            {isMember && (
                <div className="p-3 border-t bg-gray-50 rounded-b-2xl">
                    <div className="flex items-center gap-2">
                        <Textarea 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)} 
                            placeholder="Votre message..." 
                            className="flex-1 bg-white" 
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <Button onClick={handleSendMessage} size="icon" className="bg-[#2BA84A] rounded-full shrink-0"><Send className="h-5 w-5" /></Button>
                    </div>
                </div>
            )}
          </div>
        </>
      );
    };
    
    export default GroupeDetail;