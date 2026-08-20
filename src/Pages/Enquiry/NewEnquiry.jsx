import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NewEnquiry.css";
import api from "../../utils/api";
import { isBlank, isValidPhoneNumber, normalizePhoneNumber } from "../../utils/formValidation";

function NewEnquiry() {

  const navigate = useNavigate();

  const initialForm = {
    name: "",
    contact: "",
    email: "",
    pickupCity: "",

    purpose: "",
    destination: "",

    startDate: "",
    endDate: "",

    persons: "",
    adult: "",
    child: "",

    mealplan: "",
    hotel: "",
    transport: "",

    leadSource: "",
    contactTime: "",

    status: "Pending",
    message: ""
  };

  const [form, setForm] = useState(initialForm);
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HANDLE CHANGE
  const handleChange = (e) => {
    const value = e.target.name === "contact" ? normalizePhoneNumber(e.target.value) : e.target.value;
    setForm({
      ...form,
      [e.target.name]: value
    });
  };

  // AUTO PERSON COUNT
  useEffect(() => {
    const total = Number(form.adult || 0) + Number(form.child || 0);
    setForm(prev => ({ ...prev, persons: total }));
  }, [form.adult, form.child]);

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isBlank(form.name) || isBlank(form.contact) || isBlank(form.destination)) {
      alert("Please enter your name, 10-digit contact number, and destination.");
      return;
    }

    if (!isValidPhoneNumber(form.contact)) {
      alert("Enter a valid 10-digit contact number.");
      return;
    }

    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      alert("Start date cannot be later than the end date.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/enquiries", form);
      setShowPopup(true);
      setForm(initialForm);

      setTimeout(() => {
        setShowPopup(false);
      }, 2000);
    } catch {
      alert("Unable to submit enquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="enquiry-page">

      <div className="enquiry-header">
        <h1> ENQUIRE NOW</h1>
      </div>

      <form onSubmit={handleSubmit} className="enquiry-form">

        {/* CUSTOMER DETAILS */}
        <div className="form-section">
          <h3>Customer Details</h3>

          <div className="form-grid">
            <div className="field">
              <label>Customer Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Contact Number</label>
              <input
                type="tel"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                title="Enter a 10-digit contact number"
                required
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} />
            </div>

            <div className="field">
              <label>Pickup City</label>
              <input name="pickupCity" value={form.pickupCity} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* TRAVEL DETAILS */}
        <div className="form-section">
          <h3>Travel Details</h3>

          <div className="form-grid">
            <div className="field">
              <label>Travel Type</label>
              <input name="purpose" value={form.purpose} onChange={handleChange} />
            </div>

            <div className="field">
              <label>Destination</label>
              <input name="destination" value={form.destination} onChange={handleChange} required />
            </div>

            <div className="field">
                <label>Meal Plan</label>
                <select name="mealplan" value={form.mealplan} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="CPAI">CPAI (Breakfast)</option>
                  <option value="MAPAI">MAPAI (Breakfast + Dinner)</option>
                  <option value="APAI">APAI (All Meals)</option>
                </select>
              </div>

            <div className="field">
              <label>Start Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} max={form.endDate || undefined} />
            </div>

            <div className="field">
              <label>End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} min={form.startDate || undefined} />
            </div>

            <div className="field">
              <label>Total Persons ({form.persons})</label>
              <div className="persons-grid">
                <input type="number" min="0" step="1" name="adult" value={form.adult} onChange={handleChange} placeholder="Adults" />
                <input type="number" min="0" step="1" name="child" value={form.child} onChange={handleChange} placeholder="Children" />
              </div>
            </div>
          </div>
        </div>

        {/* PREFERENCES */}
        <div className="form-section">
          <h3>Preferences</h3>

          <div className="form-grid">
            <div className="field">
              <label>Hotel Type</label>
              <select name="hotel" value={form.hotel} onChange={handleChange}>
                <option value="">Select</option>
                <option>3 Star</option>
                <option>4 Star</option>
                <option>5 Star</option>
              </select>
            </div>

            <div className="field">
              <label>Transport</label>
              <select name="transport" value={form.transport} onChange={handleChange}>
                <option value="">Select</option>
                <option>Standard</option>
                <option>Premium</option>
                <option>Luxury</option>
              </select>
            </div>

            <div className="field">
              <label>Lead Source</label>
              <select name="leadSource" value={form.leadSource} onChange={handleChange}>
                <option value="">Select</option>
                <option>Instagram</option>
                <option>Website</option>
                <option>Reference</option>
                <option>WhatsApp</option>
                <option>B2B</option>
              </select>
            </div>

            <div className="field">
              <label>Preferred Contact Time</label>
              <select name="contactTime" value={form.contactTime} onChange={handleChange}>
                <option value="">Select</option>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
              </select>
            </div>
          </div>
        </div>

        {/* MESSAGE */}
        <div className="form-section">
          <h3>Additional Notes</h3>

          <div className="field full">
            <textarea name="message" value={form.message} onChange={handleChange} />
          </div>
        </div>

        {/* BUTTONS */}
        <div className="form-buttons">
          <button type="button" className="back-btn" onClick={() => navigate("/")}>
            Back
          </button>

          <button className="submit-btn" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? "Submitting enquiry…" : "Submit Enquiry"}
          </button>
        </div>

      </form>

      {/* SUCCESS POPUP */}
      {showPopup && (
        <div className="success-popup">
          Enquiry Submitted Successfully
        </div>
      )}

    </div>
  );
}

export default NewEnquiry;
