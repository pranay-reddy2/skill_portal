import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/background.jpg";

// --- Icon Components ---
function SearchIcon({ className = "text-gray-400" }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function LocationIcon({ className = "text-gray-500" }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold border border-green-300 transform hover:scale-105 transition">
      <svg
        className="w-4 h-4 text-green-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Guaranteed
    </div>
  );
}

// --- Main Component ---
export default function SearchWorkers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedProfession, setSelectedProfession] = useState("all");

  const navigate = useNavigate();

  const professions = [
    "All",
    "Plumber",
    "Electrician",
    "Carpenter",
    "Painter",
    "Mason",
    "AC Technician",
    "Mechanic",
    "Cleaner",
    "Gardner",
  ];

  useEffect(() => {
    setUserLocation({
      lat: 12.9716,
      lng: 77.5946,
      address: "Whitefield, Bangalore",
    });
    fetchWorkers();
  }, []);

  useEffect(() => {
    filterWorkers();
  }, [searchQuery, selectedProfession, workers, userLocation]);

  const fetchWorkers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userLocation) {
        params.append("lat", userLocation.lat);
        params.append("lng", userLocation.lng);
        params.append("radius", "50");
      }

      const url = `http://localhost:8080/api/worker/?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        const workersWithEnhancedData = (data.workers || []).map((worker) => ({
          ...worker,
          rating: worker.rating || (4 + Math.random()).toFixed(1),
          jobsCompleted:
            worker.jobsCompleted || Math.floor(Math.random() * 100) + 10,
          verified:
            worker.verified !== undefined
              ? worker.verified
              : Math.random() > 0.5,
        }));
        setWorkers(workersWithEnhancedData);
      } else {
        throw new Error(data.error || "Failed to fetch workers");
      }
    } catch (err) {
      console.error("Fetch workers error:", err);
      setError(err.message);

      // fallback mock data
      setWorkers([
        {
          _id: "1",
          fullName: "Ramesh Kumar",
          profession: "Plumber",
          skills: ["Pipe Repair", "Faucets", "Drain Cleaning"],
          verified: true,
          experience: "5 years",
          geometry: { coordinates: [77.5946, 12.9716] },
          rating: "4.5",
          jobsCompleted: 45,
        },
        {
          _id: "2",
          fullName: "Sunita Devi",
          profession: "Electrician",
          skills: ["Wiring", "Installation", "Lighting"],
          verified: false,
          experience: "8 years",
          geometry: { coordinates: [77.6046, 12.9816] },
          rating: "4.7",
          jobsCompleted: 78,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterWorkers = () => {
    let filtered = [...workers];

    if (selectedProfession !== "all") {
      filtered = filtered.filter(
        (worker) =>
          worker.profession?.toLowerCase() === selectedProfession.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (worker) =>
          worker.fullName?.toLowerCase().includes(query) ||
          worker.profession?.toLowerCase().includes(query) ||
          worker.skills?.some((skill) => skill.toLowerCase().includes(query))
      );
    }

    if (userLocation) {
      filtered = filtered.map((worker) => {
        const lat = worker.geometry?.coordinates?.[1] || worker.location?.lat;
        const lng = worker.geometry?.coordinates?.[0] || worker.location?.lng;
        if (lat && lng) {
          return {
            ...worker,
            distance: calculateDistance(
              userLocation.lat,
              userLocation.lng,
              lat,
              lng
            ),
          };
        }
        return worker;
      });

      filtered.sort((a, b) => {
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
    }

    setFilteredWorkers(filtered);
  };

  const handleWorkerClick = (workerId) => {
    navigate(`/worker/${workerId}`);
  };

  return (
    <div
      className="min-h-screen p-4 md:p-8 pb-20"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-8 border-b-8 border-blue-500/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3">
              <span role="img" aria-label="Find Worker">
                🔍
              </span>{" "}
              Find Experts
            </h1>
            <button
              onClick={() => navigate("/customer-home")}
              className="text-gray-500 hover:text-red-600 p-2 rounded-full bg-gray-100 hover:bg-red-50 focus:ring-4 focus:ring-red-100"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
              <SearchIcon className="text-blue-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg placeholder-gray-500 focus:ring-4 focus:ring-blue-200 focus:border-blue-500"
              placeholder="Search by name, Plumber, or skill..."
            />
          </div>

          {userLocation && (
            <div className="flex items-center justify-between text-md text-blue-700 font-semibold mt-4 bg-blue-50 p-3 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2">
                <LocationIcon className="w-6 h-6 text-blue-600" />
                <span>Searching near: {userLocation.address}</span>
              </div>
              <button className="text-sm text-blue-500 hover:text-blue-600">
                Change Location
              </button>
            </div>
          )}
        </div>

        {/* Worker Cards */}
        {isLoading ? (
          <p className="text-center text-gray-600">Loading workers...</p>
        ) : error ? (
          <div className="text-center text-red-600 font-bold">
            Error: {error}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <p className="text-center text-gray-600 font-semibold">
            No matching workers found.
          </p>
        ) : (
          <div className="space-y-6">
            {filteredWorkers.map((worker) => (
              <div
                key={worker._id}
                onClick={() => handleWorkerClick(worker._id)}
                className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl hover:ring-4 hover:ring-blue-100 transition cursor-pointer"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    {worker.profileImageUrl ? (
                      <img
                        src={worker.profileImageUrl}
                        alt={worker.fullName}
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-500 shadow-lg">
                        <span className="text-4xl font-extrabold text-blue-600">
                          {worker.fullName?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-2xl font-extrabold text-gray-900">
                          {worker.fullName}
                        </h3>
                        <span className="inline-block bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-bold mt-1">
                          {worker.profession}
                        </span>
                      </div>
                      {worker.verified && <VerifiedBadge />}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700 mt-2">
                      <span>
                        ⭐{" "}
                        {typeof worker.rating === "object"
                          ? worker.rating.average
                          : worker.rating}{" "}
                        / 5
                      </span>

                      {worker.distance && (
                        <span className="text-green-600">
                          📍 {worker.distance.toFixed(1)} km away
                        </span>
                      )}
                      <span>| {worker.jobsCompleted} Jobs</span>
                      <span>| {worker.experience} Exp.</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {worker.skills?.slice(0, 4).map((skill, i) => (
                        <span
                          key={i}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
