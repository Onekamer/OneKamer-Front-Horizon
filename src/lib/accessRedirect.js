
import { toast } from "@/components/ui/use-toast";
import { canUserAccess } from "./accessControl";

export const redirectIfNoAccess = async (user, navigate, section, action = "read") => {
  if (!user) {
    toast({
      title: "Connexion requise",
      description: "Veuillez vous connecter pour accéder à cette section.",
      variant: "destructive",
    });
    navigate("/auth");
    return true;
  }

  const allowed = await canUserAccess(user, section, action);
  if (!allowed) {
    toast({
      title: "Accès restreint",
      description: "Cette fonctionnalité est réservée aux membres disposant d’un forfait supérieur.",
      variant: "destructive",
    });
    navigate("/forfaits");
    return true;
  }
  return false;
};
