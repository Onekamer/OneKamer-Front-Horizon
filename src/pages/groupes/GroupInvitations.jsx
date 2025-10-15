import React, { useState, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { useNavigate } from 'react-router-dom';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent } from '@/components/ui/card';
    import { Loader2, ArrowLeft, Check, X, Mail } from 'lucide-react';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Badge } from '@/components/ui/badge';

    const StatusBadge = ({ status }) => {
        const variants = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            accepted: 'bg-green-100 text-green-800 border-green-200',
            declined: 'bg-red-100 text-red-800 border-red-200',
        };
        const text = {
            pending: 'En attente',
            accepted: 'Acceptée',
            declined: 'Refusée',
        }
        return <Badge variant="outline" className={variants[status]}>{text[status]}</Badge>;
    };

    const InvitationCardReceived = ({ invitation, onAction, loadingId }) => {
        const { groupe, invited_by_profile } = invitation;
        const isLoading = loadingId === invitation.id;

        return (
            <Card className="w-full">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={groupe?.image_url} />
                            <AvatarFallback>{groupe?.nom[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold">{groupe?.nom}</p>
                            <p className="text-sm text-gray-500">Invité par {invited_by_profile?.username}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={() => onAction(invitation.id, 'accept')} disabled={isLoading}>
                            {loadingId === `${invitation.id}-accept` ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 text-green-500"/>}
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => onAction(invitation.id, 'decline')} disabled={isLoading}>
                            {loadingId === `${invitation.id}-decline` ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4 text-red-500"/>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    };

    const InvitationCardSent = ({ invitation }) => {
        const { groupe, invited_user_profile } = invitation;

        return (
            <Card className="w-full">
                 <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={groupe?.image_url} />
                            <AvatarFallback>{groupe?.nom[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold">{groupe?.nom}</p>
                            <p className="text-sm text-gray-500">Invité : {invited_user_profile?.username}</p>
                        </div>
                    </div>
                    <StatusBadge status={invitation.status} />
                </CardContent>
            </Card>
        )
    };

    const GroupInvitations = () => {
        const { user } = useAuth();
        const navigate = useNavigate();
        const { toast } = useToast();
        const [receivedInvites, setReceivedInvites] = useState([]);
        const [sentInvites, setSentInvites] = useState([]);
        const [loading, setLoading] = useState(true);
        const [loadingId, setLoadingId] = useState(null);
        const [invitationsCount, setInvitationsCount] = useState(0);

        const fetchData = useCallback(async () => {
            if (!user) return;
            setLoading(true);

            const { data: allInvites, error: invitesError } = await supabase
                .from('groupes_invitations')
                .select('*')
                .or(`invited_user_id.eq.${user.id},invited_by.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (invitesError) {
                toast({ title: "Erreur", description: "Impossible de charger les invitations.", variant: "destructive" });
                setLoading(false);
                return;
            }

            if (!allInvites || allInvites.length === 0) {
                setReceivedInvites([]);
                setSentInvites([]);
                setInvitationsCount(0);
                setLoading(false);
                return;
            }
            
            const receivedData = allInvites.filter(i => i.invited_user_id === user.id);
            const sentData = allInvites.filter(i => i.invited_by === user.id);

            const groupIds = [...new Set(allInvites.map(i => i.groupe_id))];
            const userIds = [...new Set(allInvites.flatMap(i => [i.invited_by, i.invited_user_id]))];

            const [groupsRes, profilesRes] = await Promise.all([
                supabase.from('groupes').select('*').in('id', groupIds),
                supabase.from('profiles').select('id, username, avatar_url').in('id', userIds)
            ]);

            if (groupsRes.error || profilesRes.error) {
                toast({ title: "Erreur", description: "Impossible de charger les détails des invitations.", variant: "destructive" });
                setLoading(false);
                return;
            }

            const groupsMap = new Map(groupsRes.data.map(g => [g.id, g]));
            const profilesMap = new Map(profilesRes.data.map(p => [p.id, p]));

            const combineData = (invitations) => invitations.map(i => ({
                ...i,
                groupe: groupsMap.get(i.groupe_id),
                invited_by_profile: profilesMap.get(i.invited_by),
                invited_user_profile: profilesMap.get(i.invited_user_id),
            }));

            setReceivedInvites(combineData(receivedData));
            setSentInvites(combineData(sentData));
            setInvitationsCount(receivedData.filter(i => i.status === 'pending').length);
            
            setLoading(false);
        }, [user, toast]);

        useEffect(() => {
            if (!user) {
                toast({ title: "Connexion requise", variant: "destructive" });
                navigate('/compte');
            } else {
                fetchData();
            }
        }, [user, navigate, toast, fetchData]);
        
        useEffect(() => {
            if (!user) return;
            const channel = supabase.channel('group-invitations-realtime')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'groupes_invitations', filter: `invited_user_id=eq.${user.id}`}, payload => {
                fetchData();
              })
              .on('postgres_changes', { event: '*', schema: 'public', table: 'groupes_invitations', filter: `invited_by=eq.${user.id}`}, payload => {
                fetchData();
              })
              .subscribe();
            
            return () => supabase.removeChannel(channel);
        }, [user, fetchData]);


        const handleInvitationAction = async (invitationId, action) => {
            setLoadingId(`${invitationId}-${action}`);
            
            const rpcName = action === 'accept' ? 'accept_invitation' : 'decline_invitation';
            const { error } = await supabase.rpc(rpcName, { p_invitation_id: invitationId });

            if (error) {
                toast({ title: "Erreur", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Succès !", description: `Invitation ${action === 'accept' ? 'acceptée' : 'refusée'}.` });
                fetchData();
            }
            setLoadingId(null);
        };

        const pendingReceived = receivedInvites.filter(inv => inv.status === 'pending');

        return (
            <>
                <Helmet>
                    <title>Invitations de Groupe - OneKamer.co</title>
                </Helmet>
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/groupes')}><ArrowLeft className="h-5 w-5"/></Button>
                        <h1 className="text-3xl font-bold text-[#2BA84A]">Invitations</h1>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin"/></div>
                    ) : (receivedInvites.length === 0 && sentInvites.length === 0) ? (
                        <div className="text-center py-12 text-gray-500">
                             <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="font-semibold">Aucune invitation pour le moment.</p>
                        </div>
                    ) : (
                        <Tabs defaultValue="received" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="received">Reçues {invitationsCount > 0 && `(${invitationsCount})`}</TabsTrigger>
                                <TabsTrigger value="sent">Envoyées</TabsTrigger>
                            </TabsList>
                            <TabsContent value="received" className="space-y-4 pt-4">
                                {pendingReceived.length > 0 ? (
                                    pendingReceived.map(inv => <InvitationCardReceived key={inv.id} invitation={inv} onAction={handleInvitationAction} loadingId={loadingId} />)
                                ) : (
                                    <p className="text-center text-gray-500 py-8">Aucune invitation en attente.</p>
                                )}
                            </TabsContent>
                            <TabsContent value="sent" className="space-y-4 pt-4">
                               {sentInvites.length > 0 ? (
                                    sentInvites.map(inv => <InvitationCardSent key={inv.id} invitation={inv} />)
                               ) : (
                                    <p className="text-center text-gray-500 py-8">Vous n'avez envoyé aucune invitation.</p>
                               )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </>
        )
    }

    export default GroupInvitations;