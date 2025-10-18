import React, { useState, useRef } from "react";
import { Mic, StopCircle } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";

export default function AudioRecorder({ user, receiverId, onUpload }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

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
      console.error("🎙️ Accès micro refusé :", err);
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    setUploading(true);
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.stop();
    await new Promise((r) => (mr.onstop = r));

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const fileName = `message-${Date.now()}.webm`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("echanges_audio")
        .upload(fileName, blob, { contentType: "audio/webm" });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("echanges_audio")
        .getPublicUrl(fileName);

      await supabase.from("echanges").insert({
        type: "audio",
        content_url: publicUrl.publicUrl,
        sender_id: user?.id,
        receiver_id: receiverId,
      });

      console.log("✅ Audio envoyé :", publicUrl.publicUrl);
      onUpload?.(publicUrl.publicUrl);
    } catch (err) {
      console.error("Erreur upload audio :", err);
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
          className="p-2 rounded-full bg-gray-100"
          title="Démarrer l'enregistrement"
        >
          <Mic className="h-5 w-5" />
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="p-2 rounded-full bg-red-500 text-white"
          title="Arrêter et envoyer"
        >
          <StopCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
