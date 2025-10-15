import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const CreatePost = () => {
  const { user, profile } = useAuth();
  const [postText, setPostText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreviewUrl(null);
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!postText.trim() && !mediaFile) {
      toast({ title: 'Oups !', description: 'Le post ne peut pas être vide 😅', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté pour publier.', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      let uploadedPath = null;
      let mediaType = null;

      if (mediaFile) {
        const filePath = `${user.id}/${Date.now()}-${mediaFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, mediaFile);

        if (uploadError) throw uploadError;
        
        uploadedPath = filePath;
        mediaType = mediaFile.type.startsWith('image') ? 'image' : 'video';
      }

      const postData = {
        user_id: user.id,
        content: postText,
        likes_count: 0,
        comments_count: 0,
      };

      if (uploadedPath) {
        if (mediaType === 'image') {
          postData.image_url = uploadedPath;
        } else {
          postData.video_url = uploadedPath;
        }
      }

      const { error: insertError } = await supabase.from('posts').insert([postData]);

      if (insertError) throw insertError;

      toast({
        title: '✅ Publication réussie',
        description: 'Votre post a été publié avec succès 🎉',
      });

      setPostText('');
      handleRemoveMedia();
    } catch (error) {
      console.error('Erreur de publication :', error.message);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Textarea
          placeholder={`Quoi de neuf, ${profile?.username || 'cher membre'} ?`}
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          className="mb-3"
          disabled={loading}
        />

        {mediaPreviewUrl && (
          <div className="relative mb-3 w-40 h-40">
            {mediaFile.type.startsWith('image') ? (
              <img
                src={mediaPreviewUrl}
                alt="Aperçu"
                className="w-full h-full rounded-md object-cover"
              />
            ) : (
              <video
                src={mediaPreviewUrl}
                controls
                className="w-full h-full rounded-md object-cover"
              />
            )}
            <Button
              size="icon"
              variant="destructive"
              onClick={handleRemoveMedia}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => mediaInputRef.current?.click()}
              disabled={loading}
            >
              📎 Ajouter média
            </Button>
            <input
              id="mediaInput"
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={handlePublish}
              disabled={loading || (!postText.trim() && !mediaFile)}
              className="bg-gradient-to-r from-[#2BA84A] to-[#F5C300] text-white font-bold"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publier
            </Button>
        </div>

      </CardContent>
    </Card>
  );
};

export default CreatePost;