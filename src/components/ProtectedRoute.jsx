import React, { useEffect } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { redirectIfNoAccess } from "@/lib/accessRedirect";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ section, action = "read", children }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      redirectIfNoAccess(profile, navigate, section, action);
    }
  }, [profile, navigate, section, action]);

  return children;
};

export default ProtectedRoute;