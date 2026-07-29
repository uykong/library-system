// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { loginUser } from "../../lib/actions"; // NEW: Import our real database function

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // NEW: State for errors
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(""); // Clear any old errors

    // 1. Call our real database action!
    const response = await loginUser(email, password);

    if (response.success) {
      // 2. Save their role in the browser's local memory so our catalog knows who they are
      localStorage.setItem("userRole", response.role!);
      localStorage.setItem("userId", response.id!);
      
      // 3. Send them to the library catalog
      router.push("/"); 
    } else {
      // Show the error message from the database
      setErrorMessage(response.error!);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Please sign in to access the library</p>
        </div>

        {/* NEW: Error Message Box */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-black shadow-sm"
              placeholder="librarian@university.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-black shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-medium text-white transition-all shadow-sm flex justify-center items-center ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* NEW: Link to your registration page */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Don't have an account? <a href="/register" className="text-blue-600 hover:underline font-medium">Create one here</a></p>
        </div>

        
      </div>
    </div>
  );
}