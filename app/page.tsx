"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit =async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try{
      const response = await fetch('/api/auth/login',{
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body : JSON.stringify({ email, password })
    });
    const data= await response.json();
    if(data.success) {
      localStorage.setItem('accessToken', data.token);
      if(data.user.role=== 'teacher') {
        router.push('/teacher_dashboard');
      } else if(data.user.role === 'student') {
        router.push('/student_dashboard');
      }
      else{
        setError("Invalid user role.");
      }
    }
    else {
      setError(data.message || "Login failed. Please try again.");
    }
    setLoading(false);
    } catch (error) {
      console.error("Error during login:", error);
      setError("An unexpected error occurred. Please try again later.");
      return;
    }
  };
  return (
    <main className="login-shell">
      <div className="login-orb login-orb-left" aria-hidden="true" />
      <div className="login-orb login-orb-right" aria-hidden="true" />

      <section className="login-panel">
        <aside className="login-brand">
          <p className="login-kicker">Academic Intelligence</p>
          <h1>Student Analysis Dashboard</h1>
          <p>
            Monitor performance trends, compare cohorts, and use predictive insights
            to support better learning outcomes.
          </p>
          <div className="login-meta">
            <span>Secure Access</span>
            <span>Teacher and Student Roles</span>
            <span>Live Analytics</span>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="login-card" noValidate>
          <div className="login-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue to your dashboard.</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="name@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="login-footer">Protected by role-based authentication</p>
        </form>
      </section>
    </main>
  );
}