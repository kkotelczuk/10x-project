import type { NavUserViewModel } from "@/types";

const MOCK_AUTH_KEY = "mock-authenticated";
const MOCK_USER_KEY = "mock-user";
const MOCK_PROFILE_COMPLETE_KEY = "mock-profile-complete";

const notifyAuthChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("mock-auth-change"));
};

export const setMockUser = (user: NavUserViewModel, profileComplete = false) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_AUTH_KEY, "true");
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  if (profileComplete) {
    localStorage.setItem(MOCK_PROFILE_COMPLETE_KEY, "true");
  }
  notifyAuthChange();
};

export const clearMockUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MOCK_AUTH_KEY);
  localStorage.removeItem(MOCK_USER_KEY);
  localStorage.removeItem(MOCK_PROFILE_COMPLETE_KEY);
  notifyAuthChange();
};

export const readMockUser = (): NavUserViewModel | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MOCK_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as NavUserViewModel;
  } catch {
    return null;
  }
};

export const isMockAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MOCK_AUTH_KEY) === "true";
};

export const isMockProfileComplete = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MOCK_PROFILE_COMPLETE_KEY) === "true";
};
