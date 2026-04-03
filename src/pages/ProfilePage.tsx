import { useState, useEffect, useRef } from "react";
import { Upload, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { getApplicantProfile, updateApplicantProfile } from "@/lib/careerApi";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useJsApiLoader } from '@react-google-maps/api';
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from 'react-places-autocomplete';
import { setKey, fromLatLng } from 'react-geocode';

// ✅ Vite ke liye environment variable
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// ✅ Address interface
interface AddressType {
  location?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latLong?: string;
}

export default function ProfilePage() {
  const { profile, updateProfile, setProfile, token, isProfileComplete, profileCompletion } = useApp();
  const { toast } = useToast();
  const [editing, setEditing] = useState(!isProfileComplete);
  const [saving, setSaving] = useState(false);

  // ✅ Google Maps API Load
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  // ✅ Set API key for react-geocode
  if (GOOGLE_MAPS_API_KEY) {
    setKey(GOOGLE_MAPS_API_KEY);
  }

  // ✅ Address details state
  const [addressDetails, setAddressDetails] = useState<AddressType>({
    location: '',
    city: '',
    state: '',
    zipcode: '',
    latLong: '',
  });

  // File refs
  const cnicInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);

  // File states
  const [cnicFile, setCnicFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  // const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);

  // Existing file URLs from API
  const [existingCnicUrl, setExistingCnicUrl] = useState<string | null>(null);
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);
  const [existingCoverLetterUrl, setExistingCoverLetterUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getApplicantProfile(token)
      .then((res) => {
        const addressData = res.data.address as AddressType | undefined;
        
        setProfile({
          fullName: res.data.name,
          email: res.data.email,
          phone: res.data.phone_no,
          password: "",
          jobTitle: res.data.job_title ?? "",
          location: addressData?.city ?? "",
          experience: res.data.experience ?? "",
          availability: res.data.availability ?? "",
          resumeUploaded: Boolean(res.data.resume_document),
          cnicUploaded: Boolean(res.data.cnic_image),
          profile_picture: res.data.profile_picture,
          address: res.data.address,
          cover_letter: res.data.cover_letter,
          skills: res.data.skills,
          education: res.data.education,
          linkedin_profile: res.data.linkedin_profile,
          portfolio_url: res.data.portfolio_url,
          is_verified: res.data.is_verified,
          active: res.data.active,
          createdAt: res.data.createdAt,
          updatedAt: res.data.updatedAt,
        });
        
        // ✅ Address details set karo
        if (addressData) {
          setAddressDetails({
            location: (addressData as any).location || '',
            city: addressData.city || '',
            state: addressData.state || '',
            zipcode: (addressData as any).zipcode || (addressData as any).postal_code || '',
            latLong: (addressData as any).latLong || '',
          });
          updateProfile("location", (addressData as any).location || addressData.city || '');
        }
        
        
        if (res.data.cnic_image) {
          setExistingCnicUrl(res.data.cnic_image);
        }
        if (res.data.resume_document) {
          setExistingResumeUrl(res.data.resume_document);
        }
        if (res.data.cover_letter) {
  setExistingCoverLetterUrl(res.data.cover_letter);
}
      })
      .catch((err) => {
        toast({ title: "Profile load failed", description: err?.message || "Cannot load profile" });
      });
  }, [token, setProfile, toast, updateProfile]);

  // ✅ Address select handler - poora address store karega
  const handleAddressSelect = async (value: string) => {
    if (value === '') {
      toast({ title: "Invalid address", description: "Please enter a valid address" });
      return;
    }

    try {
      const results = await geocodeByAddress(value);
      const latlng = await getLatLng(results?.[0]);

      const response = await fromLatLng(
        latlng.lat.toString(),
        latlng.lng.toString(),
      );

      const { address_components } = response.results?.[0];
      let city = '';
      let state = '';
      let postalCode = '';

      address_components.forEach((component: any) => {
        const { types, long_name } = component;
        types.forEach((type: any) => {
          switch (type) {
            case 'locality':
              city = long_name;
              break;
            case 'administrative_area_level_1':
              state = long_name;
              break;
            case 'postal_code':
              postalCode = long_name;
              break;
            default:
              break;
          }
        });
      });

      // ✅ Location mein poora address store hoga
      setAddressDetails({
        location: value,      // ✅ Pura address yahan store ho raha hai
        city: city,
        state: state,
        zipcode: postalCode,
        latLong: `${latlng.lat},${latlng.lng}`,
      });
      
      updateProfile("location", value);  // ✅ Pura address show karo input mein
      
      toast({ title: "Address selected", description: `${city}, ${state}` });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "An error occurred. Please try again later." });
    }
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type === "application/pdf" || file.type.includes("document")) {
        setCnicFile(file);
        updateProfile("cnicUploaded", true);
      } else {
        toast({ title: "Invalid file type", description: "CNIC must be an image or document (PDF)" });
      }
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" || file.type.includes("document") || file.type.includes("word")) {
        setResumeFile(file);
        updateProfile("resumeUploaded", true);
      } else {
        toast({ title: "Invalid file type", description: "Resume must be a document (PDF, DOC, DOCX)" });
      }
    }
  };

  const handleCoverLetterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    if (file.type === "application/pdf" || file.type.includes("document") || file.type.includes("word")) {
      setCoverLetterFile(file);
      updateProfile("cover_letter", true);
    } else {
      toast({ title: "Invalid file type", description: "Cover letter must be a document (PDF, DOC, DOCX)" });
    }
  }
};
  const removeCnicFile = () => {
    setCnicFile(null);
    setExistingCnicUrl(null);
    updateProfile("cnicUploaded", false);
    if (cnicInputRef.current) cnicInputRef.current.value = "";
  };

  const removeResumeFile = () => {
    setResumeFile(null);
    setExistingResumeUrl(null);
    updateProfile("resumeUploaded", false);
    if (resumeInputRef.current) resumeInputRef.current.value = "";
  };

  const removecoverLetterFile = () => {
    setCoverLetterFile(null);
    if (coverLetterInputRef.current) coverLetterInputRef.current.value = "";
  };

  // ✅ FIXED Save handler - ab address.location properly send hoga
  const handleSave = async () => {
    if (!token) {
      toast({ title: "Not logged in", description: "Please login to save profile" });
      return;
    }

    setSaving(true);
    try {
      // ✅ Ensure addressDetails.location has the full address
      const addressToSend = {
        location: addressDetails.location || profile.location,  // ✅ Pura address yahan se lega
        city: addressDetails.city,
        state: addressDetails.state,
        postal_code: addressDetails.zipcode,
        latLong: addressDetails.latLong,
      };

      console.log("📦 Sending address to backend:", addressToSend);  // Debug ke liye

      await updateApplicantProfile(token, {
        name: profile.fullName,
        phone_no: profile.phone,
        job_title: profile.jobTitle,
        experience: profile.experience,
        availability: profile.availability,
        // cover_letter: profile.cover_letter,
        skills: profile.skills?.join(","),
        linkedin_profile: profile.linkedin_profile,
        address: addressToSend as any,
        cnic_image: cnicFile || undefined,
        resume_document: resumeFile || undefined,
        cover_letter: coverLetterFile || undefined,
      });
      toast({ title: "Profile saved", description: "Your profile is updated" });
      setEditing(false);
      setCnicFile(null);
      setResumeFile(null);
      setCoverLetterFile(null);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? (err as { message?: string }).message : undefined;
      toast({ title: "Save failed", description: message || "Unable to update profile" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Completion Banner */}
        {!isProfileComplete && (
          <div className="mb-6 rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Complete your profile to apply for jobs
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fill in all required fields to unlock job applications.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={profileCompletion.percent} className="h-2 flex-1" />
                  <span className="text-xs font-semibold text-primary whitespace-nowrap font-mono-data">
                    {profileCompletion.percent}%
                  </span>
                </div>
                {profileCompletion.missing.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {profileCompletion.missing.map((field) => (
                      <span
                        key={field}
                        className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-xs font-medium"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isProfileComplete && (
          <div className="mb-6 rounded-lg bg-accent/10 border border-accent/30 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
            <p className="text-sm font-medium text-foreground">
              Profile complete — you can now apply for jobs!
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] ${
              editing
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-100 text-gray-600 hover:bg-primary/10"
            } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {saving ? "Saving..." : editing ? "Save" : "Edit"}
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 lg:p-8 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-4 mb-2">
            {/* <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-semibold text-primary">
                {profile?.profile_picture
                  ? profile?.profile_picture
                  : "?"}
              </span>
            </div> */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
  {profile?.profile_picture ? (
    <img
      src={profile?.profile_picture}
      alt={profile?.fullName || "Profile Picture"}
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-xl font-semibold text-primary">
      ?
    </span>
  )}
</div>

            <div>
              <p className="text-lg font-semibold text-gray-800">
                {profile.fullName || "Your Name"}
              </p>
              <p className="text-sm text-gray-500">
                {profile.jobTitle || "Your Job Title"}
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              ["Full Name *", "fullName"],
              ["Email", "email"],
              ["Phone Number *", "phone"],
              ["Job Title / Trade *", "jobTitle"],
              ["Experience *", "experience"],
              // ["Availability *", "availability"],
            ] as const).map(([label, key]) => {
              const fieldKey = key as keyof typeof profile;
              const isRequired = label.endsWith("*");
              const isEmpty = typeof profile[fieldKey] === "string" && !(profile[fieldKey] as string).trim();
              const showError = isRequired && isEmpty && !editing;

              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={profile[fieldKey] as string}
                    onChange={(e) => updateProfile(fieldKey, e.target.value)}
                    disabled={!editing}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      showError ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-gray-100 disabled:text-gray-500`}
                    placeholder={label.replace(" *", "")}
                  />
                  {showError && (
                    <p className="text-xs text-red-500 mt-1">This field is required</p>
                  )}
                </div>
              );
            })}
          </div>


<div key="availability">
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    Availability *
  </label>
  <select
    value={profile.availability as string}
    onChange={(e) => updateProfile("availability", e.target.value)}
    disabled={!editing}
    className={`w-full px-4 py-2 rounded-lg border ${
      !profile.availability && editing ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-gray-100 disabled:text-gray-500`}
  >
    <option value="">Select Availability</option>
    <option value="Immediately available">Immediately available</option>
    <option value="Available within 1 week">Available within 1 week</option>
    <option value="Available within 2 weeks">Available within 2 weeks</option>
    <option value="Available within 1 month">Available within 1 month</option>
    <option value="Available after current project">Available after current project</option>
    <option value="Available part-time">Available part-time</option>
    <option value="Not available">Not available</option>
  </select>
  {!profile.availability && editing && (
    <p className="text-xs text-red-500 mt-1">This field is required</p>
  )}
</div>


          {/* ✅ Address Field with Google Places Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Address *
            </label>
            {isLoaded ? (
              <PlacesAutocomplete
                value={addressDetails.location || profile.location}
                onSelect={handleAddressSelect}
                onChange={(value) => {
                  setAddressDetails(prev => ({ ...prev, location: value }));
                  updateProfile("location", value);
                }}
              >
                {({
                  getInputProps,
                  suggestions,
                  getSuggestionItemProps,
                  loading: loadingSuggestions,
                }) => (
                  <div className="relative">
                    <input
                      {...getInputProps({
                        placeholder: 'Enter your full address',
                        disabled: !editing,
                        className: `w-full px-4 py-2 rounded-lg border ${
                          !addressDetails.city && editing ? "border-red-500" : "border-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-gray-100 disabled:text-gray-500`,
                      })}
                    />
                    {suggestions.length > 0 && !loadingSuggestions && editing && (
                      <div className="absolute left-0 top-full z-[100] mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                        {suggestions.map((suggestion) => {
                          const style = {
                            backgroundColor: suggestion.active ? '#6D53DE' : '#FFFFFF',
                            cursor: 'pointer',
                            color: suggestion.active ? '#FFFFFF' : '#292D32',
                          };
                          return (
                            <div
                              {...getSuggestionItemProps(suggestion, { style })}
                              key={suggestion.placeId}
                              className="px-4 py-3 transition-colors hover:bg-primary/10"
                            >
                              {suggestion.description}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </PlacesAutocomplete>
            ) : (
              <input
                type="text"
                value={profile.location}
                onChange={(e) => updateProfile("location", e.target.value)}
                disabled={!editing}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-gray-100"
                placeholder="Loading address search..."
              />
            )}
            {!addressDetails.city && editing && (
              <p className="text-xs text-red-500 mt-1">Please select a valid address from suggestions</p>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                LinkedIn Profile
              </label>
              <input
                type="text"
                value={profile.linkedin_profile ?? ""}
                onChange={(e) => updateProfile("linkedin_profile", e.target.value)}
                disabled={!editing}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-gray-100"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Skills
              </label>
              <input
                type="text"
                value={profile.skills?.join(", ") ?? ""}
                onChange={(e) => updateProfile("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                disabled={!editing}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-gray-100"
                placeholder="React, TypeScript, Node.js"
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* CNIC Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CNIC *
                </label>
                <input
                  type="file"
                  ref={cnicInputRef}
                  onChange={handleCnicChange}
                  accept="image/*,.pdf,.doc,.docx"
                  disabled={!editing}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => cnicInputRef.current?.click()}
                  disabled={!editing}
                  className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer active:scale-[0.97] ${
                    profile.cnicUploaded || cnicFile || existingCnicUrl
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-primary/50"
                  } ${!editing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {profile.cnicUploaded || cnicFile || existingCnicUrl ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-xs text-gray-500 truncate max-w-[120px]">
                        {cnicFile ? cnicFile.name : existingCnicUrl ? "CNIC Uploaded" : "Uploaded"}
                      </span>
                      {editing && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCnicFile();
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Upload CNIC</p>
                    </>
                  )}
                </button>
                {existingCnicUrl && !cnicFile && (
                  <a
                    href={existingCnicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 block"
                  >
                    View current CNIC
                  </a>
                )}
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Resume 
                </label>
                <input
                  type="file"
                  ref={resumeInputRef}
                  onChange={handleResumeChange}
                  accept=".pdf,.doc,.docx"
                  disabled={!editing}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={!editing}
                  className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer active:scale-[0.97] ${
                    profile.resumeUploaded || resumeFile || existingResumeUrl
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-primary/50"
                  } ${!editing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {profile.resumeUploaded || resumeFile || existingResumeUrl ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-xs text-gray-500 truncate max-w-[120px]">
                        {resumeFile ? resumeFile.name : existingResumeUrl ? "Resume Uploaded" : "Uploaded"}
                      </span>
                      {editing && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeResumeFile();
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Upload Resume</p>
                    </>
                  )}
                </button>
                {existingResumeUrl && !resumeFile && (
                  <a
                    href={existingResumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 block"
                  >
                    View current Resume
                  </a>
                )}
              </div>

              {/* Cover Letter Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cover Letter
                </label>
                <input
                  type="file"
                  ref={coverLetterInputRef}
                  onChange={handleCoverLetterChange}
                  accept=".pdf,.doc,.docx"
                  disabled={!editing}
                  className="hidden"
                />
                {/* <button
                  type="button"
                  onClick={() => coverLetterInputRef.current?.click()}
                  disabled={!editing}
                  className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer active:scale-[0.97] ${
                    coverLetterFile
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-primary/50"
                  } ${!editing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {coverLetterFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-xs text-gray-500 truncate max-w-[120px]">
                        {coverLetterFile.name}
                      </span>
                      {editing && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removecoverLetterFile();
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Upload Cover Letter</p>
                    </>
                  )}
                </button> */}

<button
  type="button"
  onClick={() => coverLetterInputRef.current?.click()}
  disabled={!editing}
  className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer active:scale-[0.97] ${
    coverLetterFile || existingCoverLetterUrl
      ? "border-green-500 bg-green-50"
      : "border-gray-300 hover:border-primary/50"
  } ${!editing ? "opacity-50 cursor-not-allowed" : ""}`}
>
  {(coverLetterFile || existingCoverLetterUrl) ? (
    <div className="flex items-center justify-center gap-2">
      <CheckCircle2 className="w-5 h-5 text-green-500" />
      <div className="text-left">
        <span className="text-xs text-gray-500 truncate max-w-[120px] block">
          {coverLetterFile ? coverLetterFile.name : "Cover Letter Uploaded"}
        </span>
        {/* {existingCoverLetterUrl && !coverLetterFile && (
          <a
            href={existingCoverLetterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline block"
            onClick={(e) => e.stopPropagation()}
          >
            View current cover letter
          </a>
        )} */}
      </div>
      {editing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            removecoverLetterFile();
            setExistingCoverLetterUrl(null);
          }}
          className="text-red-500 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </button>
      )}

 



    </div>
  ) : (
    <>
      <FileText className="w-5 h-5 text-gray-400 mx-auto mb-1" />
      <p className="text-xs text-gray-400">Upload Cover Letter</p>
    </>
  )}
</button>
{existingCoverLetterUrl && !coverLetterFile && (
          <a
            href={existingCoverLetterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline block"
            onClick={(e) => e.stopPropagation()}
          >
            View current cover letter
          </a>
        )}
              </div>
            </div>
          </div>

          {/* Profile Status */}
          {profile.is_verified !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Status:</span>
              <span className={profile.is_verified ? "text-green-600" : "text-red-500"}>
                {profile.is_verified ? "Verified" : "Not Verified"}
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}