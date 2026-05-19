"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function NewAgreementPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    initiator: "",
    counterparty: "",
    terms: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const agreement = await api.createAgreement(form);
      router.push(`/agreements/${agreement.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create agreement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="page-title">New Agreement</h1>
      <p className="page-subtitle">
        Create a new agreement between two Stellar addresses.
      </p>

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="initiator">Your Stellar Address (Initiator)</label>
            <input
              id="initiator"
              name="initiator"
              type="text"
              placeholder="G..."
              value={form.initiator}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="counterparty">Counterparty Stellar Address</label>
            <input
              id="counterparty"
              name="counterparty"
              type="text"
              placeholder="G..."
              value={form.counterparty}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="terms">Agreement Terms</label>
            <textarea
              id="terms"
              name="terms"
              placeholder="Describe the terms of this agreement…"
              value={form.terms}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating…" : "Create Agreement"}
            </button>
            <a href="/" className="btn btn-ghost">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </>
  );
}
