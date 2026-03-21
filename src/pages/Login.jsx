import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || t("loginFailed"));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h1 className="auth-logo">tlacobook</h1>
        <p className="auth-tagline">{t("connectText")}</p>
      </div>
      <div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <input
            type="email"
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">
            {t("login")}
          </button>
          <hr />
          <Link to="/register" className="btn-success">
            {t("register")}
          </Link>
        </form>
      </div>
    </div>
  );
}
