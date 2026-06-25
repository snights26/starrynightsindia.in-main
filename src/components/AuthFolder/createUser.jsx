import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import "./CreateUser.css";

function CreateUser({ mode = "create" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const { register, user: authUser, updateStoredUser, logout } = useAuth();
  const isCompleteProfile = mode === "complete";

  const [user, setUser] = useState({
    name: "",
    email: "",
    contact: "",
    dob: "",
    idType: "",
    idNumber: "",
    emergencyName: "",
    emergencyContact: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    gender: "",
    preferredDestinations: "",
    preferredTravelStyle: "",
    travelPreferences: "",
    profileImage: "",
  });

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isCompleteProfile && authUser) {
      setUser((prev) => ({ ...prev, ...authUser }));
      setPreview(authUser.profileImageUrl || authUser.profileImage || authUser.photo || "");
      return;
    }
    if (!userId) return;

    setLoading(true);
    api.get(`/users/${userId}`)
      .then((data) => {
        setUser((prev) => ({ ...prev, ...data }));
        setPreview(data.profileImage || data.photo || "");
      })
      .finally(() => setLoading(false));
  }, [authUser, isCompleteProfile, userId]);

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isCompleteProfile) {
      try {
        const updateKey = authUser?.id || user.id || user.userId;
        const updated = await api.put(`/users/${updateKey}`, user);
        updateStoredUser(updated);
        alert(updated.profileCompleted ? "Profile completed" : "Profile saved. You can complete more details later.");
        navigate("/dashboard", { replace: true });
      } catch (error) {
        alert(error?.response?.data?.message || "Unable to save profile");
      }
      return;
    }

    if (userId) {
      try {
        await api.put(`/users/${userId}`, user);
        alert("User Updated");
        navigate("/dashboard");
      } catch {
        alert("Unable to update user");
      }
      return;
    }

    try {
      await register({
        name: user.name,
        email: user.email,
        password: "User@123",
        contact: user.contact,
        city: user.city,
        state: user.state,
        country: user.country,
        pincode: user.pincode,
      });
      alert("User Created. Temporary password: User@123");
      navigate("/");
    } catch {
      alert("Unable to create user");
    }
  };

  if (loading) return <div className="eu-loading">Loading...</div>;

  return (
    <div className="create-user-page">
      <form className="eu-card" onSubmit={handleSubmit}>
        <div className="eu-header">
          <div>
            <h2>{isCompleteProfile ? "Profile Details" : userId ? "Update User" : "Create User"}</h2>
            {isCompleteProfile && <p>Add details now or continue to the dashboard and complete them later.</p>}
          </div>
          <div className="eu-header-actions">
            {isCompleteProfile && (
              <button type="button" onClick={() => navigate("/dashboard", { replace: true })}>
                Continue
              </button>
            )}
            {isCompleteProfile ? (
              <button type="button" onClick={() => logout(false)}>Logout</button>
            ) : (
              <button type="button" onClick={() => navigate(-1)}>Back</button>
            )}
          </div>
        </div>

        <div className="eu-section center">
          <h3>Profile Photo</h3>
          <div className="eu-avatar-box">
            {preview ? <img src={preview} alt="profile" /> : <div className="eu-avatar-placeholder">No Image</div>}
          </div>
          <input type="file" onChange={handleImage} />
        </div>

        <div className="eu-section">
          <h3>Basic Info</h3>
          <div className="eu-grid-2">
            <div className="eu-field">
              <label>User ID</label>
              <input name="userId" value={user.userId || ""} readOnly />
            </div>
            <div className="eu-field">
              <label>Name</label>
              <input name="name" value={user.name || ""} onChange={handleChange} required />
            </div>
            <div className="eu-field">
              <label>Email</label>
              <input
                name="email"
                value={user.email || ""}
                onChange={handleChange}
                required
                readOnly={isCompleteProfile && user.authProvider === "GOOGLE"}
              />
            </div>
            <div className="eu-field">
              <label>Mobile Number</label>
              <input name="contact" value={user.contact || ""} onChange={handleChange} />
            </div>
            <div className="eu-field">
              <label>Date of Birth</label>
              <input type="date" name="dob" value={user.dob || ""} onChange={handleChange} />
            </div>
            <div className="eu-field">
              <label>Gender</label>
              <select name="gender" value={user.gender || ""} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {isCompleteProfile && (
          <div className="eu-section">
            <h3>Travel Preferences</h3>
            <div className="eu-grid-2">
              <div className="eu-field">
                <label>Preferred Destinations</label>
                <input
                  name="preferredDestinations"
                  value={user.preferredDestinations || ""}
                  onChange={handleChange}
                  placeholder="Goa, Kerala, Bali"
                />
              </div>
              <div className="eu-field">
                <label>Preferred Travel Style</label>
                <select name="preferredTravelStyle" value={user.preferredTravelStyle || ""} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Family">Family</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Budget">Budget</option>
                  <option value="Honeymoon">Honeymoon</option>
                </select>
              </div>
              <div className="eu-field eu-field-wide">
                <label>Preferences</label>
                <textarea
                  name="travelPreferences"
                  value={user.travelPreferences || ""}
                  onChange={handleChange}
                  placeholder="Tell us what kind of trips you prefer"
                />
              </div>
            </div>
          </div>
        )}

        <div className="eu-section">
          <h3>Identity</h3>
          <div className="eu-grid-2">
            <div className="eu-field">
              <label>ID Type</label>
              <input name="idType" value={user.idType || ""} onChange={handleChange} />
            </div>
            <div className="eu-field">
              <label>ID Number</label>
              <input name="idNumber" value={user.idNumber || ""} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="eu-section">
          <h3>Emergency Contact</h3>
          <div className="eu-grid-2">
            <div className="eu-field">
              <label>Name</label>
              <input name="emergencyName" value={user.emergencyName || ""} onChange={handleChange} />
            </div>
            <div className="eu-field">
              <label>Contact</label>
              <input name="emergencyContact" value={user.emergencyContact || ""} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="eu-section">
          <h3>Address</h3>
          <div className="eu-grid-2">
            <div className="eu-field">
              <label>City</label>
              <input name="city" value={user.city || ""} onChange={handleChange} />
            </div>
            <div className="eu-field">
              <label>State</label>
              <input name="state" value={user.state || ""} onChange={handleChange} />
            </div>
            <div className="eu-field">
              <label>Country</label>
              <input name="country" value={user.country || ""} onChange={handleChange} />
            </div>
            <div className="eu-field">
              <label>Pincode</label>
              <input name="pincode" value={user.pincode || ""} onChange={handleChange} />
            </div>
          </div>
        </div>

        <button className="eu-delete-btn" type="submit">
          {isCompleteProfile ? "Save Profile" : userId ? "Update User" : "Create User"}
        </button>
      </form>
    </div>
  );
}

export default CreateUser;
