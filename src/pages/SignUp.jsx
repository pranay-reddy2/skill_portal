// src/pages/SignUp.jsx - Fixed signup navigation flow
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/background.jpg";

export default function SignUp() {
  const [userType, setUserType] = useState("worker");
  const [formData, setFormData] = useState({
    fullName: "",
    profession: "",
    email: "",
    password: "",
    mobileNumber: "",
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userType === "customer" && (!formData.email || !formData.password)) {
      setError("Email & Password required for Customers!");
      return;
    }

    if (userType === "worker" && !formData.mobileNumber) {
      setError("Mobile number required for Workers!");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const payload =
        userType === "worker"
          ? {
              email: formData.email || `${formData.mobileNumber}@temp.com`,
              password: formData.mobileNumber,
              fullName: formData.fullName,
              profession: formData.profession,
              role: "worker",
            }
          : {
              email: formData.email,
              password: formData.password,
              role: "customer",
            };

      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");

      // ✅ Store token and user data
      if (data.access) {
        localStorage.setItem("token", data.access);
      }
      if (data.user) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      console.log("✅ Signup successful:", data);

      // Wait a bit to ensure localStorage is written
      await new Promise((resolve) => setTimeout(resolve, 100));

      setIsLoading(false);

      // Navigate based on user type
      // Worker signup -> worker-home (to create profile) -> worker-profile
      // Customer signup -> customer-home (to complete profile) -> worker-page
      if (userType === "worker") {
        navigate("/worker-home");
      } else {
        navigate("/customer-home");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to signup. Please try again.");
      setIsLoading(false);
    }
  };

  const tabClass = (type) =>
    `flex-1 py-2 rounded-lg text-center cursor-pointer transition ${
      userType === type
        ? "bg-blue-600 text-white shadow-md"
        : "bg-gray-200 text-gray-700"
    }`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gray-100"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>

        {/* Toggle User Type */}
        <div className="flex gap-2 mb-6 bg-gray-200 p-1 rounded-xl">
          <button
            className={tabClass("worker")}
            onClick={() => setUserType("worker")}
          >
            Worker
          </button>
          <button
            className={tabClass("customer")}
            onClick={() => setUserType("customer")}
          >
            Customer
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {userType === "worker" && (
            <>
              <div className="mb-4">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium">Profession</label>
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="Plumber, Electrician..."
                  required
                />
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium">Mobile Number</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </>
          )}

          {userType === "customer" && (
            <>
              <div className="mb-4">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="example@gmail.com"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="•••••••"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="+91 9876543210"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white py-3 rounded-lg text-lg font-semibold transition ${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
