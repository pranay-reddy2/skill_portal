import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, fetchWithAuth, getAuthToken } from "../config/api";

export default function WorkerHome() {
  const [step, setStep] = useState(1);
  const [inputMethod, setInputMethod] = useState("text");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  // ✅ FIXED: Properly initialize GoogleGenerativeAI
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    "AIzaSyCimq7Mcl27O8Z96O8gqiPz-qRbw55H7N4";
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  const [formData, setFormData] = useState({
    experience: "",
    skills: "",
    voiceBlob: null,
    aadhaarNumber: "",
    profileImage: null,
    aadhaarImage: null,
  });

  const [previewUrls, setPreviewUrls] = useState({
    profile: null,
    aadhaar: null,
  });

  // Check authentication on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrls.profile) URL.revokeObjectURL(previewUrls.profile);
      if (previewUrls.aadhaar) URL.revokeObjectURL(previewUrls.aadhaar);
    };
  }, [previewUrls.profile, previewUrls.aadhaar]);

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      return;
    }

    if (previewUrls[type]) {
      URL.revokeObjectURL(previewUrls[type]);
    }

    setFormData((s) => ({ ...s, [`${type}Image`]: file }));
    setPreviewUrls((p) => ({ ...p, [type]: URL.createObjectURL(file) }));
    setError(null);
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setFormData((s) => ({ ...s, voiceBlob: blob }));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(
        () => setRecordingTime((prev) => prev + 1),
        1000
      );
    } catch (err) {
      console.error("Recording error:", err);
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    } catch (e) {
      console.error("Stop recording error:", e);
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const validateStep1 = () => {
    setError(null);
    if (inputMethod === "text") {
      if (!formData.experience.trim()) {
        setError("Please describe your work experience");
        return false;
      }
      if (formData.experience.trim().length < 10) {
        setError("Please provide more details (at least 10 characters)");
        return false;
      }
      if (!formData.skills.trim()) {
        setError("Please list at least one skill");
        return false;
      }
    } else {
      if (!formData.voiceBlob) {
        setError("Please record your introduction");
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    setError(null);
    if (!/^\d{12}$/.test(formData.aadhaarNumber.trim())) {
      setError("Aadhaar must be exactly 12 digits");
      return false;
    }
    if (!formData.profileImage) {
      setError("Please upload a profile photo");
      return false;
    }
    return true;
  };

  const convertSpeechToText = async (audioBlob) => {
    console.log("🎙️ Converting speech to text...");

    if (!genAI) {
      console.error("❌ Google AI API key not configured");
      return "API key not configured. Please add VITE_GEMINI_API_KEY to your .env file";
    }

    try {
      // Convert audio blob to base64
      const base64Audio = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1];
          console.log("✅ Audio converted to base64");
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      console.log("🤖 Calling Gemini API for transcription...");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: audioBlob.type || "audio/webm",
                  data: base64Audio,
                },
              },
              {
                text: "This audio file contains a worker introducing themselves in a local Indian language (Telugu, Hindi, Kannada, Odia, Bengali, Tamil, Urdu, or English). Please transcribe the audio into clear English text and extract: 1) Their work experience (years and type of work) 2) Their skills or specializations. Format the response as: Experience: [details]. Skills: [comma-separated list].",
              },
            ],
          },
        ],
      });

      const text =
        result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        result?.response?.text?.() ||
        "No text could be extracted from the audio";

      console.log("✅ Transcription result:", text);
      return text;
    } catch (err) {
      console.error("❌ Speech-to-text error:", err);

      if (err.message?.includes("API key")) {
        return "Invalid API key. Please check your VITE_GEMINI_API_KEY";
      }
      if (err.message?.includes("quota")) {
        return "API quota exceeded. Please try again later or use text input.";
      }

      return `Unable to transcribe audio: ${err.message}. Please use text input instead.`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate before submission
    if (!validateStep2()) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("🚀 Starting profile submission...");

      // 🔐 Check authentication
      const authToken = getAuthToken();
      if (!authToken) {
        setError("Authentication required. Please sign in again.");
        navigate("/");
        return;
      }

      // 🎙️ Prepare text description (voice or manual input)
      let textDesc = "";
      if (inputMethod === "voice") {
        console.log("📝 Processing voice input...");
        textDesc = await convertSpeechToText(formData.voiceBlob);

        // Check if transcription failed
        if (
          textDesc.includes("Unable to transcribe") ||
          textDesc.includes("API key not configured") ||
          textDesc.includes("quota exceeded")
        ) {
          setError(textDesc + " Please use text input instead.");
          setIsLoading(false);
          return;
        }

        console.log(
          "✅ Voice transcribed:",
          textDesc.substring(0, 100) + "..."
        );
      } else {
        textDesc = `Experience: ${formData.experience.trim()}. Skills: ${formData.skills.trim()}`;
        console.log("✅ Using manual text input");
      }

      // 🧾 Build form data
      const data = new FormData();
      data.append("text", textDesc);
      data.append("aadhaarNumber", formData.aadhaarNumber.trim());
      data.append("photo", formData.profileImage);

      if (formData.aadhaarImage) {
        data.append("aadhaar", formData.aadhaarImage);
      }

      console.log("📤 Sending profile data to backend...");

      // 🚀 Send POST request
      const resp = await fetchWithAuth(API_ENDPOINTS.WORKER.GENERATE_CARD, {
        method: "POST",
        body: data,
      });

      // 🧩 Parse the response body ONCE
      const json = await resp.json();
      console.log("📥 Backend response:", json);

      // ❌ Handle server errors
      if (!resp.ok) {
        throw new Error(json.error || json.message || "Failed to save profile");
      }

      console.log("✅ Profile created successfully!");
      alert("Profile saved successfully!");

      // ✅ Navigate to worker profile if ID exists
      if (json.worker && json.worker._id) {
        console.log("🔄 Navigating to profile:", json.worker._id);
        navigate(`/worker-profile/${json.worker._id}`);
      } else {
        console.error("⚠️ Worker ID not returned:", json);
        setError(
          "Profile created but ID missing. Please refresh and try again."
        );
      }
    } catch (err) {
      console.error("❌ Submit error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-3xl mx-auto">
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Intro Card */}
          <aside className="col-span-5 hidden md:block">
            <div className="sticky top-20 rounded-3xl bg-white/75 backdrop-blur-lg border border-white/20 shadow-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15 8H9L12 2Z" fill="currentColor" />
                    <path
                      d="M3 20H21V18C21 14 17 12 12 12C7 12 3 14 3 18V20Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quick Intro
                  </h3>
                  <p className="text-sm text-gray-500">Finish in 2 minutes</p>
                </div>
              </div>

              <ol className="space-y-3 mt-6">
                <li className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200/50">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      Tell about your work
                    </h4>
                    <p className="text-xs text-gray-500">
                      Text or record intro
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200/50">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      Add identity & photo
                    </h4>
                    <p className="text-xs text-gray-500">
                      Upload photo and Aadhaar
                    </p>
                  </div>
                </li>
              </ol>

              <div className="mt-6 text-sm text-gray-600">
                <p className="mb-2 font-medium">Security</p>
                <div className="text-xs bg-blue-50/70 border border-blue-200/50 rounded-md p-3">
                  We never share Aadhaar publicly — used only to verify
                  identity.
                </div>
              </div>
            </div>
          </aside>

          {/* Right: Form */}
          <main className="col-span-12 md:col-span-7">
            <div className="rounded-3xl bg-white/75 backdrop-blur-lg border border-white/20 shadow-xl p-6 md:p-8">
              <header className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                    Complete your profile
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Add experience, skills and ID
                  </p>
                </div>

                <div className="text-sm text-slate-700">
                  <span className="inline-flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full shadow-sm border border-gray-200/80">
                    Step {step}/2
                  </span>
                </div>
              </header>

              {/* Progress bar */}
              <div className="w-full bg-gray-200/70 rounded-full h-2 mb-6 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-600 to-blue-400"
                  style={{ width: `${(step / 2) * 100}%` }}
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* STEP 1 */}
                {step === 1 && (
                  <>
                    <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
                      <label className="text-sm font-medium text-gray-700">
                        How would you like to introduce yourself?
                      </label>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setInputMethod("text")}
                          className={`flex gap-3 items-center justify-center py-3 rounded-xl transition-all duration-200 ${
                            inputMethod === "text"
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M4 6H20V8H4zM4 10H20V12H4zM4 14H14V16H4z"
                              fill="currentColor"
                            />
                          </svg>
                          Text
                        </button>

                        <button
                          type="button"
                          onClick={() => setInputMethod("voice")}
                          className={`flex gap-3 items-center justify-center py-3 rounded-xl transition-all duration-200 ${
                            inputMethod === "voice"
                              ? "bg-rose-600 text-white shadow-lg shadow-rose-500/30"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 1C13.1 1 14 1.9 14 3V11C14 12.1 13.1 13 12 13C10.9 13 10 12.1 10 11V3C10 1.9 10.9 1 12 1Z"
                              fill="currentColor"
                            />
                            <path
                              d="M19 11C19 14.31 16.31 17 13 17H11C7.69 17 5 14.31 5 11H7C7 13.21 8.79 15 11 15H13C15.21 15 17 13.21 17 11H19Z"
                              fill="currentColor"
                            />
                          </svg>
                          Voice
                        </button>
                      </div>

                      {/* Text inputs */}
                      {inputMethod === "text" && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="text-xs text-gray-500">
                              Experience
                            </label>
                            <textarea
                              name="experience"
                              value={formData.experience}
                              onChange={handleChange}
                              placeholder="Eg. 3 years as painter & handyman in Hyderabad"
                              rows={3}
                              className="w-full mt-2 p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-500">
                              Skills (comma separated)
                            </label>
                            <input
                              name="skills"
                              value={formData.skills}
                              onChange={handleChange}
                              placeholder="Eg. Plumbing, Painting, Electrical"
                              className="w-full mt-2 p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      )}

                      {/* Voice input */}
                      {inputMethod === "voice" && (
                        <div className="mt-4 text-center">
                          <div className="inline-flex items-center gap-4 rounded-xl border border-gray-200 px-5 py-4 bg-white shadow-md">
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-800">
                                {isRecording
                                  ? "Recording…"
                                  : formData.voiceBlob
                                  ? "Recorded"
                                  : "Not recorded"}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {isRecording
                                  ? `Live — ${formatTime(recordingTime)}`
                                  : "Max 90 seconds"}
                              </div>
                            </div>

                            <div>
                              {isRecording ? (
                                <button
                                  type="button"
                                  onClick={stopRecording}
                                  className="px-4 py-2 rounded-lg bg-white border border-rose-300 shadow-sm hover:bg-rose-50 transition-all duration-200"
                                >
                                  <span className="text-rose-600 font-semibold">
                                    ⏹ Stop
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={startRecording}
                                  className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold shadow-lg shadow-rose-500/30 hover:bg-rose-700 transform hover:-translate-y-0.5 transition-all duration-300"
                                >
                                  🎤 Record
                                </button>
                              )}
                            </div>
                          </div>

                          {formData.voiceBlob && (
                            <div className="mt-4">
                              <audio
                                controls
                                src={URL.createObjectURL(formData.voiceBlob)}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!validateStep1()) return;
                          setStep(2);
                        }}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transform hover:-translate-y-0.5 transition-all duration-300"
                      >
                        Next
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M5 12H19M19 12L12 5M19 12L12 19"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <>
                    <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Identity & Photo
                        </label>
                        <input
                          name="aadhaarNumber"
                          value={formData.aadhaarNumber}
                          onChange={handleChange}
                          placeholder="Aadhaar Number (12 digits)"
                          inputMode="numeric"
                          maxLength={12}
                          className="w-full mt-2 p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 block mb-2">
                          Profile Photo *
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer inline-flex items-center gap-3 px-4 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-200">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 5V19M5 12H19"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="text-sm text-gray-700">
                              Upload
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, "profile")}
                              className="hidden"
                            />
                          </label>

                          {previewUrls.profile ? (
                            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                              <img
                                src={previewUrls.profile}
                                alt="profile"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                              No photo
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 block mb-2">
                          Aadhaar Photo (Optional)
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer inline-flex items-center gap-3 px-4 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-200">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 5V19M5 12H19"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="text-sm text-gray-700">
                              Upload
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, "aadhaar")}
                              className="hidden"
                            />
                          </label>

                          {previewUrls.aadhaar ? (
                            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                              <img
                                src={previewUrls.aadhaar}
                                alt="aadhaar"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                              Optional
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all duration-200"
                      >
                        ← Back
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`flex-1 py-3 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
                          isLoading
                            ? "bg-gray-400 cursor-wait"
                            : "bg-green-600 shadow-green-500/30 hover:bg-green-700"
                        }`}
                      >
                        {isLoading ? "Saving..." : "Complete Profile"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>

            <div className="mt-4 text-xs text-gray-500/80 text-center">
              By continuing you agree to our terms and privacy policy.
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
