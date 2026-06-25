import { useAuth } from "../../context/AuthContext";

export default function ProfileCompletionGuard({ children }) {
  const { loading } = useAuth();

  if (loading) return null;
  return children;
}
