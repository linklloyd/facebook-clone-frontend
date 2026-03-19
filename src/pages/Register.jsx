import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
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
        <p className="auth-tagline">
          Connect with friends and the world around you on Tlacobook.
        </p>
      </div>
      <div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Create a new account</h2>
          <p style={{ color: "#606770", marginBottom: 16 }}>It's quick and easy.</p>
          {error && <div className="auth-error">{error}</div>}
          <div className="name-row">
            <input
              name="firstName"
              placeholder="First name"
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <input
              name="lastName"
              placeholder="Last name"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="New password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          <button type="submit" className="btn-success" style={{ width: "100%" }}>
            Sign Up
          </button>
          <hr />
          <Link to="/login" className="btn-link">
            Already have an account?
          </Link>
        </form>
      </div>
    </div>
  );
}
