"use client";
import Image from "next/image";
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
    <div className="background">
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <div className="text-2xl font-bold text-center text-black">
          Student Analysis Dashboard
        </div>
        
        <form onSubmit={handleSubmit} className="Login-form">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            Login
          </h2>
          
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-18 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account? <a href="#" className="text-blue-600 hover:underline">Sign up</a>
          </p>
        </form>

        <footer className="mt-8 text-sm text-gray-500">
          © 2023 Student Analysis. All rights reserved.
        </footer>
      </div>
    </div>
  );
}