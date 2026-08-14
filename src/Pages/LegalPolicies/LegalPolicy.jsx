import React from "react";
import { Link } from "react-router-dom";
import "./LegalPolicy.css";

const existingBookingTerms = [
  "Any changes in applicable tax structure as per Government notifications will be levied accordingly.",
  "Hotel check-in/check-out as per hotel policy.",
  "Base category room if not selected.",
  "Meals timings must be followed.",
  "Natural calamities expenses borne by client.",
  "Valid ID proof mandatory.",
  "Extra bed means extra mattress.",
];

const existingCancellationTerms = [
  "30+ days: Advance non-refundable.",
  "30–15 days: 50% of total cost.",
  "14–7 days: 75% of total cost.",
  "7–1 days: 100% of total cost.",
  "No refund for No Shows.",
];

const policies = {
  privacy: { title: "Privacy Policy" },
  terms: { title: "Terms & Conditions", items: existingBookingTerms },
  cancellation: { title: "Cancellation & Refund Policy", items: existingCancellationTerms },
  payment: { title: "Payment Policy" },
  delivery: { title: "Service Delivery Policy" },
};

export default function LegalPolicy({ policy }) {
  const selectedPolicy = policies[policy] ?? policies.privacy;

  return (
    <main className="legal-policy-page">
      <section className="legal-policy-content" aria-labelledby="legal-policy-title">
        <p className="legal-policy-eyebrow">Starry Nights Holidays</p>
        <h1 id="legal-policy-title">{selectedPolicy.title}</h1>
        {selectedPolicy.items ? (
          <ul>
            {selectedPolicy.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        ) : (
          <p>
            The full {selectedPolicy.title.toLowerCase()} text will be published here. For assistance,
            please <Link to="/contact">contact Starry Nights</Link>.
          </p>
        )}
        <Link className="legal-policy-back" to="/">Back to home</Link>
      </section>
    </main>
  );
}
