// src/pages/CustomerHome.jsx - FIXED VERSION
// Key fix: Use useEffect for navigation instead of during render

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/background.jpg";

export default function CustomerHome() {
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    alternatePhone: "",
  });

  const navigate = useNavigate();

  // ✅ FIXED: Navigate in useEffect, not during render
  useEffect(() => {
    if (isProfileComplete) {
      navigate("/worker-page");
    }
  }, [isProfileComplete, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const validateForm = () => {
    setError(null);
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.address.trim()) {
      setError("Address is required");
      return false;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      return false;
    }
    if (!formData.state.trim()) {
      setError("State is required");
      return false;
    }
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      setError("Pincode must be 6 digits");
      return false;
    }
    if (
      formData.alternatePhone &&
      !/^\+?[0-9]{10,13}$/.test(formData.alternatePhone.replace(/\s/g, ""))
    ) {
      setError("Please enter a valid alternate phone number");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please sign in again.");
        navigate("/");
        return;
      }

      const response = await fetch("http://localhost:8080/api/customer/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Customer profile saved successfully!");
        // Set state to trigger navigation via useEffect
        setIsProfileComplete(true);
      } else {
        throw new Error(data.error || "Failed to save profile");
      }
    } catch (err) {
      console.error("❌ Save profile error:", err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">
            Help us serve you better by completing your details
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          {/* Address */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Street address, apartment, etc."
              rows="2"
              required
            />
          </div>

          {/* City & State */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bangalore"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Karnataka"
                required
              />
            </div>
          </div>

          {/* Pincode */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Pincode
            </label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              maxLength="6"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="560001"
            />
          </div>

          {/* Alternate Phone */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Alternate Phone Number
            </label>
            <input
              type="tel"
              name="alternatePhone"
              value={formData.alternatePhone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+91 9876543210"
            />
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg py-2 px-4 mb-4 text-center text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white py-3 rounded-lg font-semibold text-lg transition ${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Saving Profile..." : "Continue"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          * Required fields
        </p>
      </div>
    </div>
  );
}
