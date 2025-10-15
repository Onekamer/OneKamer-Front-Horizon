import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Crown, Shield, LogOut, UserX } from 'lucide-react';

    const GroupMembers = ({ members, currentUserRole, currentUserId, groupId, onMemberUpdate }) => {
        const { toast } = useToast();
        const navigate = useNavigate();

        const handleKickMember = async (memberId) => {
            if (window.confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) {
                const { error } = await supabase.rpc('kick_member', { p_group_id: groupId, p_target_id: memberId });
                if (error) {
                    toast({ title: "Erreur", description: error.message, variant: 'destructive' });
                } else {
                    toast({ title: "Membre retiré" });
                    onMemberUpdate(); // Re-fetch data
                }
            }
        };

        const handleLeaveGroup = async () => {
            if (window.confirm("Êtes-vous sûr de vouloir quitter ce groupe ?")) {
                const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
                if (error) {
                    toast({ title: "Erreur", description: error.message, variant: 'destructive' });
                } else {
                    toast({ title: "Vous avez quitté le groupe." });
                    navigate('/groupes');
                }
            }
        };

        const getMemberRoleIcon = (member) => {
            if (member.role === 'fondateur') return <Crown className="h-4 w-4 text-yellow-500" />;
            if (member.is_admin) return <Shield className="h-4 w-4 text-blue-500" />;
            return null;
        };

        return (
            <div className="space-y-4">
                {members.map(({ user_id, profile, role, is_admin }) => (
                    <div key={user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback>{profile?.username?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{profile?.username}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    {getMemberRoleIcon({role, is_admin})}
                                    <span>{role === 'fondateur' ? 'Fondateur' : is_admin ? 'Admin' : 'Membre'}</span>
                                </div>
                            </div>
                        </div>

                        {currentUserRole === 'fondateur' && user_id !== currentUserId && (
                             <Button size="icon" variant="ghost" onClick={() => handleKickMember(user_id)}><UserX className="h-4 w-4 text-red-500" /></Button>
                        )}
                        {currentUserRole === 'admin' && user_id !== currentUserId && role !== 'fondateur' && !is_admin &&(
                             <Button size="icon" variant="ghost" onClick={() => handleKickMember(user_id)}><UserX className="h-4 w-4 text-red-500" /></Button>
                        )}

                    </div>
                ))}
                 {currentUserRole !== 'fondateur' && (
                    <Button variant="destructive" onClick={handleLeaveGroup} className="w-full mt-4">
                        <LogOut className="h-4 w-4 mr-2" />
                        Quitter le groupe
                    </Button>
                )}
            </div>
        );
    };

    export default GroupMembers;