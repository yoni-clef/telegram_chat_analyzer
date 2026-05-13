import { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const response = await api.post("/auth/register", { name, email, password });
      login(response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError("Registration failed");
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm">
      <h1 className="text-xl font-semibold">Register</h1>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="w-full rounded-lg bg-ocean px-3 py-2 text-white">Create account</button>
      </form>
    </div>
  );
}
