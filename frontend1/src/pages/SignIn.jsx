import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/background.jpg";

function WrenchIcon() {
  return (
    <svg
      className="w-8 h-8 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M11.42 15.17l.02.02m-0.02-0.02l-6.16-6.16a2.652 2.652 0 00-3.75 3.75l6.16 6.16m3.75-3.75l.02.02M3.75 3.75l3.75 3.75m-3.75-3.75l3.75 3.75"
      />
    </svg>
  );
}

export default function SignIn() {
  const [userType, setUserType] = useState("worker");
  const [loginMethod, setLoginMethod] = useState("mobile");

  // Automatically set login method based on user type
  useEffect(() => {
    if (userType === "worker") {
      setLoginMethod("mobile");
    } else {
      setLoginMethod("email");
    }
    setIsOtpSent(false);
    setError("");
  }, [userType]);

  // Mobile login states
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Email login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const HARD_CODED_OTP = "123456";

  const handleSendOtp = (e) => {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return setError("Please enter a valid 10-digit mobile number");
    }

    console.log("📱 Sending OTP to:", mobile);
    setIsOtpSent(true);
    alert(`OTP sent to ${mobile} (use ${HARD_CODED_OTP} for testing)`);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (otp !== HARD_CODED_OTP) throw new Error("Invalid OTP. Try again.");

      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mobile, otp, role: userType }),
      });

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store auth data
      localStorage.setItem("token", data.access);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Login successful. User data:", data.user);

      // Navigate based on whether worker has profile
      if (userType === "worker") {
        if (data.user.hasProfile && data.user.workerProfile) {
          // Worker has profile, go to their profile page
          console.log("Navigating to worker profile:", data.user.workerProfile);
          navigate(`/worker-profile/${data.user.workerProfile}`);
        } else {
          // Worker needs to create profile
          console.log("Navigating to worker home to create profile");
          navigate("/worker-home");
        }
      } else {
        // Customer goes to customer home
        console.log("Navigating to customer home");
        navigate("/customer-home");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password)
      return setError("Please enter both email and password");

    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/email-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email.toLowerCase(), password }),
        }
      );

      const data = await response.json();

      console.log("Email login response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.access);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Email login successful. Navigating to worker page");
      navigate("/worker-page");
    } catch (err) {
      console.error("Email login error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTabClass = (type) =>
    `flex-1 py-3 text-center rounded-lg cursor-pointer transition-all duration-300 ease-in-out ${
      userType === type
        ? "bg-blue-600 text-white shadow-md"
        : "bg-transparent text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4">
            <WrenchIcon />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ServiceHub</h1>
          <p className="text-gray-500 mt-2">
            Connect with skilled workers or find customers
          </p>
        </div>

        {/* User Type Selection */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          <button
            className={getTabClass("worker")}
            onClick={() => setUserType("worker")}
          >
            Worker
          </button>
          <button
            className={getTabClass("customer")}
            onClick={() => setUserType("customer")}
          >
            Customer
          </button>
        </div>

        {/* Worker → Mobile OTP Login */}
        {loginMethod === "mobile" && (
          <>
            {!isOtpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 10-digit mobile number"
                    required
                  />
                </div>
                {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
                  Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter OTP"
                    maxLength="6"
                    required
                  />
                </div>
                {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="w-full mt-3 text-sm text-blue-600 hover:underline"
                >
                  Change mobile number
                </button>
              </form>
            )}
          </>
        )}

        {/* Customer → Email/Password Login */}
        {loginMethod === "email" && (
          <form onSubmit={handleEmailLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@example.com"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-blue-600 font-semibold hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
