import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import MediaDisplay from '@/components/MediaDisplay';
import { useToast } from '@/components/ui/use-toast';

const ConversationDetail = () => {
  const { conversationId: matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [myRencontreId, setMyRencontreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversationDetails = useCallback(async () => {
    if (!user || !matchId) return;
    setLoading(true);

    const { data: myProfileData } = await supabase.from('rencontres').select('id').eq('user_id', user.id).single();
    if (myProfileData) {
      setMyRencontreId(myProfileData.id);
    }

    const { data: matchData, error: matchError } = await supabase
      .from('rencontres_matches')
      .select('user1:rencontres!user1_id(id, user_id, name, image_url), user2:rencontres!user2_id(id, user_id, name, image_url)')
      .eq('id', matchId)
      .single();

    if (matchError || !matchData) {
      setLoading(false);
      return;
    }

    const other = matchData.user1.user_id === user.id ? matchData.user2 : matchData.user1;
    setOtherUser(other);

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages_rencontres')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (!messagesError) {
      setMessages(messagesData);
    }
    setLoading(false);
  }, [user, matchId]);

  useEffect(() => {
    fetchConversationDetails();
  }, [fetchConversationDetails]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !matchId || !myRencontreId) return;

    const channel = supabase
      .channel(`rencontre_chat_${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages_rencontres',
        filter: `match_id=eq.${matchId}`
      }, (payload) => {
        setMessages(currentMessages => [...currentMessages, payload.new]);
        if (payload.new.receiver_id === myRencontreId) {
            toast({
                title: "💌 Nouveau message",
                description: `De ${otherUser?.name || 'votre match'}.`,
            });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, matchId, myRencontreId, otherUser, toast]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && user && otherUser && myRencontreId) {
      const message = {
        match_id: matchId,
        sender_id: myRencontreId,
        receiver_id: otherUser.id,
        content: newMessage.trim(),
      };
      
      setNewMessage('');

      const { error } = await supabase.from('messages_rencontres').insert(message);
      if (error) {
        console.error("Error sending message:", error);
        setNewMessage(message.content); // Restore message on error
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></div>;
  }

  if (!otherUser) {
    return (
      <div className="text-center py-12">
        <p>Conversation non trouvée.</p>
        <Button onClick={() => navigate('/rencontre/messages')}>Retour aux messages</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Conversation avec {otherUser.name} - OneKamer.co</title>
      </Helmet>
      <div className="flex flex-col h-[calc(100vh-130px)] max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
        <header className="flex items-center p-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="w-10 h-10 mr-3">
             <MediaDisplay bucket="avatars" path={otherUser.image_url} alt={otherUser.name} className="w-full h-full object-cover rounded-full" />
            <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="font-bold text-lg">{otherUser.name}</h2>
        </header>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender_id === myRencontreId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                msg.sender_id === myRencontreId
                ? 'bg-green-500 text-white rounded-br-none' 
                : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 border-t bg-white">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez un message..."
              className="flex-1"
            />
            <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ConversationDetail;