import React, { useState, useEffect, useCallback } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Loader2, UserPlus, X, Crown, Shield } from 'lucide-react';
    import { Input } from '@/components/ui/input';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
    } from "@/components/ui/alert-dialog.jsx";
    import { getUserIdByInput } from '@/lib/okcHelpers';
    
    const GroupAdmin = ({ group, onGroupUpdate }) => {
        const { user } = useAuth();
        const { toast } = useToast();
        const navigate = useNavigate();
        const [members, setMembers] = useState(group.groupes_membres || []);
        const [inviteUsername, setInviteUsername] = useState('');
        
        const [loading, setLoading] = useState(false);
        const [actionLoading, setActionLoading] = useState(false);
        
        const isFounder = group.fondateur_id === user.id;

        useEffect(() => {
            setMembers(group.groupes_membres || []);
        }, [group.groupes_membres]);

        const handleInvite = async () => {
            if (!inviteUsername.trim()) return;
            setLoading(true);
            try {
                const invitedUserId = await getUserIdByInput(inviteUsername);

                const { error: rpcError } = await supabase.rpc('invite_user_to_group', {
                    p_group_id: group.id,
                    p_user_id: invitedUserId
                });

                if (rpcError) throw rpcError;

                toast({ title: "Invitation envoyée !" });
                setInviteUsername('');
                onGroupUpdate();

            } catch(error) {
                 toast({ title: "Erreur", description: error.message, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        
        const handleRemoveMember = async (memberId) => {
            if (memberId === group.fondateur_id) return;
            setActionLoading(true);
            const { error } = await supabase.rpc('kick_member', {
                p_group_id: group.id,
                p_target_id: memberId
            });

            if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
            else {
                toast({ title: "Membre retiré" });
                onGroupUpdate();
            }
            setActionLoading(false);
        };
        
        const handleToggleAdmin = async (memberId, isAdmin) => {
             if (memberId === group.fondateur_id) return;
             setActionLoading(true);
             const { error } = await supabase.from('groupes_membres').update({ is_admin: !isAdmin }).match({ groupe_id: group.id, user_id: memberId });
             if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
             else {
                toast({ title: `Rôle mis à jour` });
                onGroupUpdate();
             }
             setActionLoading(false);
        };

        const handleTransferOwnership = async (newOwnerId) => {
            setActionLoading(true);
            const { error } = await supabase.rpc('transfer_foundation', {
                p_group_id: group.id,
                p_new_founder: newOwnerId
            });
            if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
            else {
                toast({ title: 'Propriété transférée !'});
                onGroupUpdate();
            }
            setActionLoading(false);
        };
        
        const handleDeleteGroup = async () => {
             setActionLoading(true);
             const { error } = await supabase.rpc('delete_group', { p_group_id: group.id });
             if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
             else {
                 toast({ title: 'Groupe supprimé' });
                 navigate('/groupes');
             }
             setActionLoading(false);
        };

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Gérer les membres</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Input placeholder="Inviter par pseudo..." value={inviteUsername} onChange={e => setInviteUsername(e.target.value)} />
                             <Button onClick={handleInvite} disabled={loading || !inviteUsername.trim()}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserPlus className="h-4 w-4"/>}
                            </Button>
                        </div>
                        
                        <div className="space-y-2">
                            {members.map(m => (
                                <div key={m.user_id} className="flex items-center justify-between p-2 rounded-lg">
                                    <div className="flex items-center gap-3">
                                         <Avatar><AvatarImage src={m.profile?.avatar_url} /><AvatarFallback>{m.profile?.username?.[0]}</AvatarFallback></Avatar>
                                         <p>{m.profile?.username}</p>
                                    </div>
                                    {m.role !== 'fondateur' && (isFounder || (group.groupes_membres.find(gm => gm.user_id === user.id)?.is_admin && !m.is_admin)) && (
                                        <div className="flex gap-2">
                                            {isFounder && (
                                                <Button variant={m.is_admin ? 'secondary' : 'outline'} size="sm" onClick={() => handleToggleAdmin(m.user_id, m.is_admin)} disabled={actionLoading}>
                                                    <Shield className="mr-2 h-4 w-4"/>
                                                    {m.is_admin ? 'Retirer Admin' : 'Promouvoir'}
                                                </Button>
                                            )}
                                            <Button variant="destructive" size="icon" onClick={() => handleRemoveMember(m.user_id)} disabled={actionLoading}><X className="h-4 w-4"/></Button>
                                        </div>
                                    )}
                                    {m.role === 'fondateur' && <Crown className="text-yellow-500"/>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                {isFounder && (
                    <Card>
                        <CardHeader><CardTitle>Zone Fondateur</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="outline" className="w-full">Transférer la propriété</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Transférer la propriété du groupe</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogDescription>Choisissez un nouveau fondateur. Cette action est irréversible.</AlertDialogDescription>
                                    <div className="max-h-60 overflow-y-auto">
                                        {members.filter(m => m.user_id !== user.id).map(m => (
                                            <AlertDialogAction key={m.user_id} asChild>
                                                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => handleTransferOwnership(m.user_id)}>
                                                    <Avatar className="h-8 w-8"><AvatarImage src={m.profile?.avatar_url}/><AvatarFallback>{m.profile?.username?.[0]}</AvatarFallback></Avatar>
                                                    {m.profile?.username}
                                                </Button>
                                            </AlertDialogAction>
                                        ))}
                                    </div>
                                    <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive" className="w-full">Supprimer le groupe</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogDescription>La suppression du groupe est définitive et entraînera la perte de tous les messages et membres.</AlertDialogDescription>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteGroup} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    export default GroupAdmin;