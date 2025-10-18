
    import React, { useState, useEffect, useCallback, useRef } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Card, CardContent } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Heart, MessageCircle, Share2, Send, Loader2, Trash2, Image as ImageIcon, X, Coins } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useNavigate } from 'react-router-dom';
    import { supabase } from '@/lib/customSupabaseClient';
    import { formatDistanceToNow } from 'date-fns';
    import { fr } from 'date-fns/locale';
    import { Input } from '@/components/ui/input';
    import CreatePost from '@/components/posts/CreatePost';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
      DialogTrigger,
    } from "@/components/ui/dialog";
    import { Label } from '@/components/ui/label';
    import { getInitials } from '@/lib/utils';

    const UserAvatar = ({ avatarUrl, username, className }) => {
      const [showFallback, setShowFallback] = useState(!avatarUrl);

      useEffect(() => {
        setShowFallback(!avatarUrl);
      }, [avatarUrl]);

      const initials = getInitials(username);

      if (showFallback) {
        return (
          <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#2BA84A] to-[#F5C300] text-white font-bold ${className}`}>
            {initials}
          </div>
        );
      }

      return (
        <img
          src={avatarUrl}
          alt={username || 'avatar'}
          className={`rounded-full object-cover ${className}`}
          onError={() => setShowFallback(true)}
        />
      );
    };

    const DonationDialog = ({ post, user, profile, refreshBalance, children }) => {
      const [open, setOpen] = useState(false);
      const [amount, setAmount] = useState('');
      const [message, setMessage] = useState('');
      const [isSubmitting, setIsSubmitting] = useState(false);

      const handleDonation = async (e) => {
        e.preventDefault();
        const donationAmount = parseInt(amount);
        if (!donationAmount || donationAmount <= 0) {
          toast({ title: "Montant invalide", variant: "destructive" });
          return;
        }
        setIsSubmitting(true);
        try {
          const { error: rpcError } = await supabase.rpc('make_donation', {
            sender: user.id,
            receiver: post.user_id,
            amount: donationAmount,
            msg: message
          });
          if (rpcError) throw new Error(rpcError.message);

          const postContent = `🎉 ${profile.username} a fait un don de ${donationAmount} OK Coins à ${post.profiles.username} ! Merci pour cette générosité qui fait vivre la communauté. 💚`;
          await supabase.from('posts').insert({
            user_id: user.id,
            content: postContent,
            likes_count: 0,
            comments_count: 0
          });

          toast({ title: "Don envoyé !", description: `Vous avez envoyé ${donationAmount} pièces.` });
          await refreshBalance();
          setOpen(false);
          setAmount('');
          setMessage('');
        } catch (error) {
          toast({ title: "Erreur de don", description: error.message, variant: "destructive" });
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent>
            <form onSubmit={handleDonation}>
              <DialogHeader>
                <DialogTitle>Faire un don à {post.profiles?.username}</DialogTitle>
                <DialogDescription>Montrez votre appréciation pour cette publication !</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Montant</Label>
                  <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3" placeholder="Nombre de pièces" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="message" className="text-right">Message</Label>
                  <Input id="message" value={message} onChange={e => setMessage(e.target.value)} className="col-span-3" placeholder="Message (optionnel)" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Envoyer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    };


    const CommentMedia = ({ url, type }) => {
      if (!url) return null;
    
      if (type && type.startsWith('image')) {
        return (
          <img
            src={url}
            alt="Comment media"
            className="rounded-lg max-h-40 mt-2"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://onekamer-media-cdn.b-cdn.net/posts/default_post_image.png";
            }}
          />
        );
      }
      if (type && type.startsWith('video')) {
        return <video src={url} controls className="rounded-lg max-h-40 mt-2" />;
      }
      return null;
    };

    const CommentAvatar = ({ avatarPath, username }) => {
      return (
        <UserAvatar avatarUrl={avatarPath} username={username} className="w-8 h-8" />
      );
    };


    const CommentSection = ({ postId }) => {
      const { user } = useAuth();
      const [comments, setComments] = useState([]);
      const [loadingComments, setLoadingComments] = useState(true);
      const [newComment, setNewComment] = useState('');
      const [isPostingComment, setIsPostingComment] = useState(false);
      const [mediaFile, setMediaFile] = useState(null);
      const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
      const mediaInputRef = useRef(null);
      const navigate = useNavigate();

      const fetchComments = useCallback(async () => {
        setLoadingComments(true);
      
        const { data, error } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            media_url,
            media_type,
            user_id,
            author:profiles ( id, username, avatar_url )
          `)
          .eq('content_id', postId)
          .eq('content_type', 'post')
          .order('created_at', { ascending: true });
      
        if (error) {
          console.error('Erreur chargement commentaires :', error.message);
        } else {
          setComments(data || []);
        }
        setLoadingComments(false);
      }, [postId]);

      useEffect(() => {
        fetchComments();
      
        const channel = supabase
          .channel(`comments-post-${postId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'comments',
              filter: `content_id=eq.${postId}`,
            },
            async (payload) => {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .eq('id', payload.new.user_id)
                .single();

              if (!profileError) {
                  setComments((prev) => [...prev, { ...payload.new, author: profileData }]);
              } else {
                  setComments((prev) => [...prev, { ...payload.new, author: { username: 'Anonyme', avatar_url: null } }]);
              }
            }
          )
          .subscribe();
      
        return () => {
          supabase.removeChannel(channel);
        };
      }, [postId, fetchComments]);
      
      const handleRemoveMedia = () => {
        setMediaFile(null);
        setMediaPreviewUrl(null);
        if (mediaInputRef.current) mediaInputRef.current.value = "";
      };
      
      const handleFileChange = (e) => {
        const file = e.target.files[0];
        if(file){
          setMediaFile(file);
          setMediaPreviewUrl(URL.createObjectURL(file));
        }
      }

      const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() && !mediaFile) return;
        if (!user) {
            toast({ title: 'Erreur', description: 'Vous devez être connecté.', variant: 'destructive'});
            return;
        }

        setIsPostingComment(true);
        
        try {
            let media_url = null;
            let media_type = null;

            if (mediaFile) {
                const uploadFormData = new FormData();
                const safeFile = new File([mediaFile], mediaFile.name || `upload_${Date.now()}.jpg`, { type: mediaFile.type || "image/jpeg" });
                uploadFormData.append("file", safeFile);
                uploadFormData.append("type", "comments");
                uploadFormData.append("recordId", user.id);

                const res = await fetch("https://onekamer-server.onrender.com/api/upload-media", {
                  method: "POST",
                  body: uploadFormData,
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Erreur lors de l'upload");
                
                media_url = data.url;
                media_type = safeFile.type;
            }

            const { error } = await supabase.from('comments').insert([{ 
                content_id: postId,
                content_type: 'post',
                user_id: user.id, 
                content: newComment,
                media_url: media_url,
                media_type: media_type
            }]);

            if (error) throw error;
            
            setNewComment('');
            handleRemoveMedia();

        } catch (error) {
            toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        } finally {
            setIsPostingComment(false);
        }
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="pt-4 mt-4 border-t border-gray-200">
            {loadingComments ? <Loader2 className="animate-spin" /> : 
              comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2 items-start">
                      <div className="cursor-pointer" onClick={() => navigate(`/profil/${comment.author?.id}`)}>
                        <CommentAvatar avatarPath={comment.author?.avatar_url} username={comment.author?.username} />
                      </div>
                      <div className="bg-gray-100 rounded-lg px-3 py-2 w-full">
                        <p className="text-sm font-semibold cursor-pointer" onClick={() => navigate(`/profil/${comment.author?.id}`)}>{comment.author?.username}</p>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                        {comment.media_url && <CommentMedia url={comment.media_url} type={comment.media_type} />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic mb-4">Aucun commentaire pour le moment</p>
              )
            }
            
            <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Écrire un commentaire..."
                        disabled={isPostingComment}
                    />
                    <Button type="submit" size="icon" disabled={isPostingComment || (!newComment.trim() && !mediaFile)}>
                        {isPostingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
                {mediaPreviewUrl && (
                    <div className="relative w-24 h-24">
                      {mediaFile.type.startsWith("image") ? (
                        <img src={mediaPreviewUrl} alt="preview" className="w-full h-full rounded object-cover" />
                      ) : (
                        <video src={mediaPreviewUrl} controls className="w-full h-full rounded object-cover" />
                      )}
                      <Button size="icon" variant="destructive" onClick={handleRemoveMedia} className="absolute -top-1 -right-1 h-5 w-5 rounded-full">
                          <X className="h-3 w-3" />
                      </Button>
                    </div>
                )}
                <div className="flex">
                    <Button size="sm" type="button" variant="ghost" onClick={() => mediaInputRef.current?.click()} disabled={isPostingComment}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Image/Vidéo
                    </Button>
                    <input type="file" ref={mediaInputRef} accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                </div>
            </form>
          </div>
        </motion.div>
      );
    };


    const PostCard = ({ post, user, profile, onLike, onDelete, showComments, onToggleComments, refreshBalance }) => {
      const navigate = useNavigate();
      const [isLiked, setIsLiked] = useState(false);
      const isMyPost = user?.id === post.user_id;

      const checkLiked = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('likes')
                .select('id')
                .eq('content_id', post.id)
                .eq('user_id', user.id)
                .eq('content_type', 'post')
                .maybeSingle();
            if (error) throw error;
            setIsLiked(!!data);
        } catch(error) {
            console.error("Error checking like status:", error);
        }
      }, [post.id, user]);
      
      useEffect(() => {
        checkLiked();
      }, [post, checkLiked]);

      const handleLike = async () => {
        if (!user) {
            toast({ title: 'Connectez-vous pour aimer ce post.', variant: 'destructive'});
            return;
        }
        
        setIsLiked(!isLiked); 
        await onLike(post.id, isLiked);
      };


      const handleShare = async () => {
        const shareData = {
          title: post.profiles?.username + " sur OneKamer.co" || "Publication sur OneKamer.co",
          text: post.content,
          url: window.location.href,
        };
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch(err) {
            if (err.name !== 'AbortError') {
              toast({ title: "Erreur de partage", description: "Votre navigateur ne supporte pas le partage natif.", variant: "destructive" });
            }
          }
        } else {
          toast({ title: "Partage non disponible", description: "Votre navigateur ne supporte pas le partage natif." });
        }
      };

      const imageUrl = post.image_url;
      const videoUrl = post.video_url;

      return (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="shrink-0 cursor-pointer"
                onClick={() => navigate(`/profil/${post.user_id}`)}
              >
                 <UserAvatar avatarUrl={post.profiles?.avatar_url} username={post.profiles?.username} className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/profil/${post.user_id}`)}>
                      {post.profiles?.username || 'Anonyme'}
                    </div>
                    <div className="text-sm text-[#6B6B6B]">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}</div>
                  </div>
                  {isMyPost && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => onDelete(post.id, post.image_url, post.video_url)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt="Post media" 
                className="rounded-lg w-full mb-4" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src="https://onekamer-media-cdn.b-cdn.net/posts/default_post_image.png";
                }}
              />
            )}
            {videoUrl && <video src={videoUrl} controls className="rounded-lg w-full mb-4" />}
            <div className="flex items-center gap-4 text-[#6B6B6B]">
              <button
                className={`flex items-center gap-2 hover:text-[#E0222A] transition-colors ${isLiked ? 'text-[#E0222A]' : ''}`}
                onClick={handleLike}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes_count || 0}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-[#2BA84A] transition-colors" onClick={onToggleComments}>
                <MessageCircle className="h-5 w-5" />
                <span>{post.comments_count || 0}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-[#007AFF] transition-colors" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
                <span>Partager</span>
              </button>
              {user && !isMyPost && (
                <DonationDialog post={post} user={user} profile={profile} refreshBalance={refreshBalance}>
                  <button className="flex items-center gap-2 hover:text-[#F5C300] transition-colors ml-auto">
                    <Coins className="h-5 w-5" />
                    <span>Don</span>
                  </button>
                </DonationDialog>
              )}
            </div>
            <AnimatePresence>
              {showComments && <CommentSection postId={post.id} />}
            </AnimatePresence>
          </CardContent>
        </Card>
      )
    }

    const Echange = () => {
      const { user, profile, refreshBalance } = useAuth();
      const [posts, setPosts] = useState([]);
      const [loadingPosts, setLoadingPosts] = useState(true);
      const [openComments, setOpenComments] = useState({});

      const handleToggleComments = (postId) => {
        setOpenComments(prev => ({
          ...prev,
          [postId]: !prev[postId]
        }));
      };
      
      const fetchPosts = useCallback(async () => {
        setLoadingPosts(true);
        const { data, error } = await supabase
          .from('posts')
          .select('*, profiles(id, username, avatar_url)')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
          toast({ title: 'Erreur', description: "Impossible de charger les posts.", variant: 'destructive' });
        } else {
          setPosts(data || []);
        }
        setLoadingPosts(false);
      }, []);

      const handlePostUpdate = useCallback((payload) => {
        setPosts(currentPosts => {
            return currentPosts.map(p => {
              if (p.id === payload.new.id) {
                const newPostData = { ...payload.new };
                if (!newPostData.profiles) {
                    newPostData.profiles = p.profiles;
                }
                return { ...p, ...newPostData };
              }
              return p;
            });
        });
      }, []);
      
      useEffect(() => {
        fetchPosts();
        
        const channel = supabase
          .channel('public-echange-feed')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
            const getNewPostWithProfile = async () => {
              const { data, error } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .eq('id', payload.new.user_id)
                .single();

              if (!error) {
                const newPost = {...payload.new, profiles: data};
                setPosts(current => [newPost, ...current]);
              } else {
                fetchPosts();
              }
            };
            getNewPostWithProfile();
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
              setPosts(current => current.filter(p => p.id !== payload.old.id));
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, handlePostUpdate)
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        }
      }, [fetchPosts, handlePostUpdate]);

      const handleLike = async (postId, isCurrentlyLiked) => {
        if (!user) return;
        
        if (isCurrentlyLiked) {
          await supabase.from('likes').delete().match({ content_id: postId, user_id: user.id, content_type: 'post' });
        } else {
          await supabase.from('likes').insert({ content_id: postId, user_id: user.id, content_type: 'post' });
        }
      };
      
      const handleDeletePost = async (postId, imageUrl, videoUrl) => {
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if(error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      };

      return (
        <>
          <Helmet>
            <title>Échange Communautaire - OneKamer.co</title>
            <meta name="description" content="Partagez et échangez avec la communauté OneKamer.co" />
          </Helmet>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-[#2BA84A] mb-4">Échange Communautaire</h1>
            </motion.div>

            {user && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <CreatePost />
              </motion.div>
            )}

            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recent">Récent</TabsTrigger>
                <TabsTrigger value="trending">Tendances</TabsTrigger>
              </TabsList>
              <TabsContent value="recent" className="space-y-4 mt-4">
                {loadingPosts ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#2BA84A]" /></div> : 
                  posts.map((post, index) => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <PostCard 
                        post={post} 
                        user={user}
                        profile={profile}
                        onLike={handleLike} 
                        onDelete={handleDeletePost}
                        showComments={!!openComments[post.id]}
                        onToggleComments={() => handleToggleComments(post.id)}
                        refreshBalance={refreshBalance}
                      />
                    </motion.div>
                  ))
                }
              </TabsContent>
              <TabsContent value="trending" className="space-y-4 mt-4">
                {loadingPosts ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#2BA84A]" /></div> :
                  [...posts].sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count)).map((post, index) => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <PostCard 
                        post={post} 
                        user={user}
                        profile={profile}
                        onLike={handleLike} 
                        onDelete={handleDeletePost}
                        showComments={!!openComments[post.id]}
                        onToggleComments={() => handleToggleComments(post.id)}
                        refreshBalance={refreshBalance}
                      />
                    </motion.div>
                  ))
                }
              </TabsContent>
            </Tabs>
          </div>
        </>
      );
    };

    export default Echange;
