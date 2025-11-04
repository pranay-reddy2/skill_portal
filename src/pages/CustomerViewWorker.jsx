import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function CustomerViewWorker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hire modal state
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireLoading, setHireLoading] = useState(false);
  const [hireData, setHireData] = useState({
    serviceRequired: "",
    message: "",
    urgency: "medium",
    preferredDateTime: "",
    estimatedBudget: { min: "", max: "" },
  });

  // Fetch worker details when ID changes
  useEffect(() => {
    fetchWorkerDetails();
  }, [id]);

  const fetchWorkerDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:8080/api/worker/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load worker profile");
      }

      setWorker(data.worker || data);
    } catch (err) {
      console.error("Error loading worker:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHireClick = () => {
    // Pre-fill service with worker's profession
    setHireData((prev) => ({
      ...prev,
      serviceRequired: worker.profession || "",
    }));
    setShowHireModal(true);
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();
    setHireLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please sign in to hire workers");
        navigate("/");
        return;
      }

      // Prepare the request data
      const requestData = {
        workerId: id,
        serviceRequired: hireData.serviceRequired,
        message: hireData.message,
        urgency: hireData.urgency,
        preferredDateTime: hireData.preferredDateTime || null,
        estimatedBudget: {
          min: parseFloat(hireData.estimatedBudget.min) || 0,
          max: parseFloat(hireData.estimatedBudget.max) || 0,
        },
      };

      const response = await fetch("http://localhost:8080/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send hire request");
      }

      // Success!
      alert(`✅ Hire request sent to ${worker.fullName} successfully!`);
      setShowHireModal(false);

      // Reset form
      setHireData({
        serviceRequired: "",
        message: "",
        urgency: "medium",
        preferredDateTime: "",
        estimatedBudget: { min: "", max: "" },
      });

      // Optionally navigate to requests page
      // navigate("/customer-requests");
    } catch (err) {
      console.error("Hire request error:", err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setHireLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("budget.")) {
      const budgetField = name.split(".")[1];
      setHireData((prev) => ({
        ...prev,
        estimatedBudget: {
          ...prev.estimatedBudget,
          [budgetField]: value,
        },
      }));
    } else {
      setHireData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen text-lg text-gray-600">
        Loading worker details...
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <p className="text-red-600 font-semibold text-xl mb-4">
          Error: {error}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
        >
          Go Back
        </button>
      </div>
    );

  if (!worker)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-lg">
        Worker not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 border-blue-500">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            Worker Profile
          </h1>
          <div></div>
        </div>

        {/* Profile Info */}
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="flex-shrink-0">
            {worker.profileImageUrl ? (
              <img
                src={worker.profileImageUrl}
                alt={worker.fullName}
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-400 shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-400 shadow-lg">
                <span className="text-5xl font-bold text-blue-700">
                  {worker.fullName?.charAt(0) || "?"}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              {worker.fullName}
            </h2>
            <p className="text-blue-600 font-semibold text-lg mb-3">
              {worker.profession || "Professional Worker"}
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              {worker.bio ||
                "Reliable and skilled professional available for service requests. Contact for quick and quality work."}
            </p>

            <div className="flex flex-wrap gap-3 text-gray-700 text-sm">
              <span className="bg-gray-100 px-3 py-1 rounded-full">
                ⭐ {worker.rating?.average || worker.rating || "4.5"} / 5
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">
                {worker.experience || "2 years"} experience
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">
                {worker.jobsCompleted || "20"} jobs completed
              </span>
              {worker.verified && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  ✅ Verified
                </span>
              )}
            </div>

            {worker.skills?.length > 0 && (
              <div className="mt-5">
                <h3 className="font-semibold text-gray-800 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {worker.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact + Hire */}
        <div className="p-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-700 text-center md:text-left">
            <h3 className="font-semibold text-gray-900 mb-1">Contact Info</h3>
            <p>{worker.contactNumber || "Not provided"}</p>
            <p>{worker.email || "Email not available"}</p>
            {worker.location && (
              <p className="text-sm text-gray-500 mt-1">📍 {worker.location}</p>
            )}
          </div>

          <button
            onClick={handleHireClick}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition transform hover:scale-105"
          >
            Hire Now
          </button>
        </div>
      </div>

      {/* Hire Modal */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Hire {worker.fullName}
              </h2>
              <button
                onClick={() => setShowHireModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleHireSubmit} className="p-6 space-y-4">
              {/* Service Required */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Required *
                </label>
                <input
                  type="text"
                  name="serviceRequired"
                  value={hireData.serviceRequired}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Plumbing repair, Electrical work"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message / Details *
                </label>
                <textarea
                  name="message"
                  value={hireData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the work you need done..."
                  required
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Urgency
                </label>
                <select
                  name="urgency"
                  value={hireData.urgency}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low - Can wait a week</option>
                  <option value="medium">Medium - Within a few days</option>
                  <option value="high">High - Urgent / ASAP</option>
                </select>
              </div>

              {/* Preferred Date/Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Date/Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="preferredDateTime"
                  value={hireData.preferredDateTime}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estimated Budget (₹)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    name="budget.min"
                    value={hireData.estimatedBudget.min}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Min"
                    min="0"
                  />
                  <input
                    type="number"
                    name="budget.max"
                    value={hireData.estimatedBudget.max}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Max"
                    min="0"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHireModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hireLoading}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                    hireLoading
                      ? "bg-blue-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {hireLoading ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
