import React, { useState, useRef } from "react";
import { Mic, StopCircle } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";

export default function AudioRecorder({ user, onUpload }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // 🎙️ Démarrage de l'enregistrement
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error("⚠️ Accès micro refusé :", err);
    }
  };

  // 🛑 Arrêt et envoi de l'enregistrement
  const stopRecording = async () => {
    setRecording(false);
    setUploading(true);
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.stop();
    await new Promise((r) => (mr.onstop = r));

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const fileName = `audio-${Date.now()}.webm`;

    try {
      // 🔹 Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("comments_audio")
        .upload(fileName, blob, { contentType: "audio/webm" });
      if (uploadError) throw uploadError;

      // 🔹 Récupération du lien public
      const { data: publicUrl } = supabase.storage
        .from("comments_audio")
        .getPublicUrl(fileName);

      // 🔹 Insertion du message audio dans la table `comments`
      const { error: insertError } = await supabase.from("comments").insert({
        type: "audio",
        audio_url: publicUrl.publicUrl,
        user_id: user?.id,
        content_type: "echange", // selon ton usage : "post", "annonce", etc.
        content: "",
        created_at: new Date(),
      });
      if (insertError) throw insertError;

      console.log("🎧 Audio envoyé :", publicUrl.publicUrl);
      onUpload?.(publicUrl.publicUrl);
    } catch (err) {
      console.error("Erreur pendant l'upload audio :", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!recording ? (
        <button
          onClick={startRecording}
          disabled={uploading}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          title="Démarrer l'enregistrement"
        >
          <Mic className="h-5 w-5 text-gray-700" />
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
          title="Arrêter et envoyer"
        >
          <StopCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
