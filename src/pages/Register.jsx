import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
          <h2>{t("registerTitle")}</h2>
          <p style={{ color: "#606770", marginBottom: 16 }}>{t("registerSubtitle")}</p>
          {error && <div className="auth-error">{error}</div>}
          <div className="name-row">
            <input
              name="firstName"
              placeholder={t("firstName")}
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <input
              name="lastName"
              placeholder={t("lastName")}
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
          <input
            name="email"
            type="email"
            placeholder={t("email")}
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder={t("password")}
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          <button type="submit" className="btn-success" style={{ width: "100%" }}>
            {t("registerTitle")}
          </button>
          <hr />
          <Link to="/login" className="btn-link">
            {t("alreadyHaveAccount")}
          </Link>
        </form>
      </div>
    </div>
  );
}
