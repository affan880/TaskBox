import { create } from 'zustand';

type AuthState = {
  hasAcceptedTerms: boolean;
  setHasAcceptedTerms: (accepted: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  hasAcceptedTerms: false,
  setHasAcceptedTerms: (accepted) => set({ hasAcceptedTerms: accepted }),
})); 