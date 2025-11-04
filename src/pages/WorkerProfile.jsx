// src/pages/WorkerProfile.jsx - FIXED VERSION
// Key fixes:
// 1. Better error handling for contact requests
// 2. Proper endpoint usage
// 3. Added loading state for requests

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserData } from "../config/api";
import NotificationBell from "../components/NotificationBell";

// Star Icon Component
function StarIcon({ filled }) {
  return (
    <svg
      className="w-5 h-5"
      fill={filled ? "#FFC72C" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

export default function WorkerOwnProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getUserData();

  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [contactRequests, setContactRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!id || id === "undefined") {
      setError("Invalid worker ID");
      setIsLoading(false);
      return;
    }
    fetchWorkerData();
  }, [id]);

  const fetchWorkerData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("📝 Fetching worker profile:", id);

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No authentication token found");
        setError("Please sign in to view your profile");
        navigate("/");
        return;
      }

      // Fetch worker profile
      const workerRes = await fetch(`http://localhost:8080/api/worker/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const workerData = await workerRes.json();
      console.log("📦 Worker data response:", workerData);

      if (!workerRes.ok) {
        throw new Error(workerData.error || "Worker not found");
      }

      const fetchedWorker = workerData.worker || workerData;
      setWorker(fetchedWorker);

      // Authorization check
      if (currentUser && currentUser.role === "worker") {
        const workerOwnerId =
          fetchedWorker.createdBy?._id || fetchedWorker.createdBy;
        const currentUserId = currentUser.id || currentUser._id;

        if (
          workerOwnerId?.toString() !== currentUserId?.toString() &&
          currentUser.workerProfile?.toString() !== id?.toString()
        ) {
          console.error("❌ Authorization failed");
          setError("Unauthorized access");
          setIsLoading(false);
          return;
        }
      }

      // Fetch reviews (non-blocking)
      fetchReviews();

      // Fetch contact requests (non-blocking)
      fetchContactRequests();
    } catch (err) {
      console.error("❌ Error loading worker data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const reviewsRes = await fetch(
        `http://localhost:8080/api/reviews/worker/${id}`
      );
      const reviewsData = await reviewsRes.json();
      if (reviewsRes.ok) {
        setReviews(reviewsData.reviews || []);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    }
  };

  const fetchContactRequests = async () => {
    try {
      setRequestsLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("❌ No token for contact requests");
        return;
      }

      console.log("📞 Fetching contact requests...");

      // ✅ FIXED: Correct endpoint
      const response = await fetch(
        `http://localhost:8080/api/contacts/worker`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 Contact requests response status:", response.status);

      const data = await response.json();
      console.log("📥 Contact requests data:", data);

      if (response.ok) {
        setContactRequests(data.requests || []);
        console.log(`✅ Loaded ${data.requests?.length || 0} contact requests`);
      } else {
        console.error("❌ Failed to load contact requests:", data.error);
        // Don't throw error - just log it so profile still loads
      }
    } catch (err) {
      console.error("❌ Error loading contact requests:", err);
      // Don't throw error - just log it
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/contacts/${requestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        alert(`Request ${newStatus} successfully`);
        fetchContactRequests();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // ------------------- UI Rendering -------------------

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-gray-700 mt-4 text-center">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/worker-home")}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Create New Profile
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <button
                onClick={() => navigate(`/worker-home?edit=${id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Profile Section */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {worker.profileImageUrl ? (
                <img
                  src={worker.profileImageUrl}
                  alt={worker.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-500 shadow-lg">
                  <span className="text-5xl font-bold text-blue-600">
                    {worker.fullName?.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Worker Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {worker.fullName}
                  </h1>
                  <p className="text-xl text-blue-600 font-semibold mt-1">
                    {worker.profession}
                  </p>
                </div>
                {worker.verified && (
                  <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    ✅ Verified
                  </div>
                )}
              </div>

              {/* Rating & Stats */}
              <div className="flex items-center gap-6 my-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StarIcon
                      key={i}
                      filled={i <= Math.floor(worker.rating?.average || 4)}
                    />
                  ))}
                  <span className="ml-2 text-gray-700 font-bold">
                    {worker.rating?.average || "4.5"}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ({worker.rating?.count || reviews.length} reviews)
                  </span>
                </div>
                <span className="text-gray-600">•</span>
                <span className="text-gray-700 font-medium">
                  {worker.stats?.completedJobs || "50+"} Jobs Completed
                </span>
              </div>

              {/* Experience */}
              {worker.experience && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Experience
                  </h3>
                  <p className="text-gray-700">{worker.experience}</p>
                </div>
              )}

              {/* Skills */}
              {worker.skills && worker.skills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-3xl shadow-2xl mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {["overview", "reviews", "requests", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {worker.availability && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4">Availability</h3>
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          worker.availability.available
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <span className="font-semibold">
                        {worker.availability.available
                          ? "Available Now"
                          : "Currently Unavailable"}
                      </span>
                    </div>
                  </div>
                )}

                {worker.pricing && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4">Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {worker.pricing.hourlyRate && (
                        <div>
                          <p className="text-sm text-gray-600">Hourly Rate</p>
                          <p className="text-xl font-bold text-blue-600">
                            ₹{worker.pricing.hourlyRate}
                          </p>
                        </div>
                      )}
                      {worker.pricing.minimumCharge && (
                        <div>
                          <p className="text-sm text-gray-600">
                            Minimum Charge
                          </p>
                          <p className="text-xl font-bold text-blue-600">
                            ₹{worker.pricing.minimumCharge}
                          </p>
                        </div>
                      )}
                      {worker.pricing.calloutFee && (
                        <div>
                          <p className="text-sm text-gray-600">Callout Fee</p>
                          <p className="text-xl font-bold text-blue-600">
                            ₹{worker.pricing.calloutFee}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    No reviews yet
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <StarIcon key={i} filled={i <= review.rating} />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{review.reviewText}</p>
                      <p className="text-sm text-gray-600">
                        — {review.customer?.email || "Anonymous"}
                      </p>
                      {review.verified && (
                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Contact Requests Tab */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                {requestsLoading ? (
                  <p className="text-center text-gray-600 py-8">
                    Loading requests...
                  </p>
                ) : contactRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      No contact requests yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Requests from customers will appear here
                    </p>
                  </div>
                ) : (
                  contactRequests.map((request) => (
                    <div
                      key={request._id}
                      className="bg-gray-50 rounded-xl p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg">
                            {request.serviceRequired}
                          </h4>
                          <p className="text-sm text-gray-600">
                            From:{" "}
                            {request.customer?.email ||
                              request.customer?.mobile}
                          </p>
                          {request.customerProfile && (
                            <p className="text-sm text-gray-600">
                              📍 {request.customerProfile.city},{" "}
                              {request.customerProfile.state}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : request.status === "accepted"
                              ? "bg-green-100 text-green-700"
                              : request.status === "completed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-3">{request.message}</p>

                      {request.estimatedBudget && (
                        <p className="text-sm text-gray-600 mb-3">
                          Budget: ₹{request.estimatedBudget.min} - ₹
                          {request.estimatedBudget.max}
                        </p>
                      )}

                      {request.status === "pending" && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() =>
                              handleStatusUpdate(request._id, "accepted")
                            }
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(request._id, "rejected")
                            }
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {request.status === "accepted" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(request._id, "completed")
                          }
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-4"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h4 className="text-sm text-blue-600 font-semibold mb-2">
                      Total Requests
                    </h4>
                    <p className="text-3xl font-bold text-blue-700">
                      {contactRequests.length}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="text-sm text-green-600 font-semibold mb-2">
                      Completed Jobs
                    </h4>
                    <p className="text-3xl font-bold text-green-700">
                      {worker.stats?.completedJobs || "0"}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-6">
                    <h4 className="text-sm text-yellow-600 font-semibold mb-2">
                      Average Rating
                    </h4>
                    <p className="text-3xl font-bold text-yellow-700">
                      {worker.rating?.average || "4.5"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
