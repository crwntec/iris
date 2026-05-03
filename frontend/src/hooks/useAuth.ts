import { api } from "../api/client";

export function useAuth() {
  const isLoggedIn = !!localStorage.getItem("token");

  const login = async (username: string, password: string) => {
    const { token } = await api.login(username, password);
    localStorage.setItem("token", token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return { isLoggedIn, login, logout };
}
