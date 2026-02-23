import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { CREW, type CrewMember } from "~/lib/crew";

interface UserContextType {
  user: CrewMember | null;
  setUser: (user: CrewMember) => void;
  showPicker: boolean;
  setShowPicker: (show: boolean) => void;
}

const UserContext = createContext<UserContextType | null>(null);

const STORAGE_KEY = "mogbrew_user";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<CrewMember | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = CREW.find((m) => m.id === stored);
      if (found) {
        setUserState(found);
        return;
      }
    }
    setShowPicker(true);
  }, []);

  const setUser = (member: CrewMember) => {
    setUserState(member);
    localStorage.setItem(STORAGE_KEY, member.id);
    setShowPicker(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <UserContext.Provider value={{ user, setUser, showPicker, setShowPicker }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
