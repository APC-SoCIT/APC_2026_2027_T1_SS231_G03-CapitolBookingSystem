import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";

export function useAuthGate() {
  const { user } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  const requireAuth = useCallback(() => {
    if (user) return true;
    setShowSignIn(true);
    return false;
  }, [user]);

  const closeSignIn = useCallback(() => setShowSignIn(false), []);

  return { closeSignIn, requireAuth, showSignIn };
}
