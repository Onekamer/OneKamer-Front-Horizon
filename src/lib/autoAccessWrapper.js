
import { redirectIfNoAccess } from "./accessRedirect";

export const applyAutoAccessProtection = async (user, navigate, currentPath) => {
  const pathRules = [
    { path: "/rencontre", section: "rencontre", action: "read" },
    { path: "/publier/evenement", section: "evenements", action: "create" },
    { path: "/publier/annonce", section: "annonces", action: "create" },
    { path: "/partenaires", section: "partenaires", action: "read" },
  ];

  for (const rule of pathRules) {
    if (currentPath.startsWith(rule.path)) {
      await redirectIfNoAccess(user, navigate, rule.section, rule.action);
      break; 
    }
  }
};
