"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Agreement } from "@agreestellar/types";
import { api } from "../../../lib/api";

function StatusBadge({ status }: { status: Agreement["status"] }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function AgreementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [caller, setCaller] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    api
      .getAgreement(id)
      .then(setAgreement)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function doAction(
    action: "accept" | "complete" | "cancel"
  ) {
    if (!caller.trim()) {
      setActionError("Enter your Stellar address first");
      return;
    }
    setActionError("");
    setActionLoading(true);
    try {
      let updated: Agreement;
      if (action === "accept") updated = await api.acceptAgreement(id, { caller });
      else if (action === "complete") updated = await api.completeAgreement(id, { caller });
      else updated = await api.cancelAgreement(id, { caller });
      setAgreement(updated);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <p className="empty">Loading…</p>;
  if (error) return <p className="error-msg">Error: {error}</p>;
  if (!agreement) return null;

  const createdDate = new Date(agreement.createdAt * 1000).toLocaleString();
  const updatedDate = new Date(agreement.updatedAt * 1000).toLocaleString();

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <button onClick={() => router.back()} className="btn btn-ghost" style={{ marginBottom: "1rem" }}>
          ← Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Agreement #{agreement.id}
          </h1>
          <StatusBadge status={agreement.status} />
        </div>
      </div>

      <div className="card">
        <h2>Terms</h2>
        <p style={{ marginTop: "0.5rem", lineHeight: 1.7 }}>{agreement.terms}</p>
      </div>

      <div className="card">
        <h2>Parties</h2>
        <div className="meta" style={{ marginTop: "0.5rem" }}>
          <p><strong>Initiator:</strong> <span className="address">{agreement.initiator}</span></p>
          <p style={{ marginTop: "0.4rem" }}><strong>Counterparty:</strong> <span className="address">{agreement.counterparty}</span></p>
        </div>
      </div>

      <div className="card">
        <h2>Timeline</h2>
        <div className="meta" style={{ marginTop: "0.5rem" }}>
          <p>Created: {createdDate}</p>
          <p>Last updated: {updatedDate}</p>
        </div>
      </div>

      {(agreement.status === "pending" || agreement.status === "active") && (
        <div className="card">
          <h2>Actions</h2>
          <p style={{ marginTop: "0.5rem" }}>Enter your Stellar address to perform an action.</p>
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label htmlFor="caller">Your Stellar Address</label>
            <input
              id="caller"
              type="text"
              placeholder="G..."
              value={caller}
              onChange={(e) => setCaller(e.target.value)}
            />
          </div>
          {actionError && <p className="error-msg">{actionError}</p>}
          <div className="actions">
            {agreement.status === "pending" && (
              <button
                className="btn btn-primary"
                onClick={() => doAction("accept")}
                disabled={actionLoading}
              >
                Accept
              </button>
            )}
            {agreement.status === "active" && (
              <button
                className="btn btn-primary"
                onClick={() => doAction("complete")}
                disabled={actionLoading}
              >
                Complete
              </button>
            )}
            <button
              className="btn btn-danger"
              onClick={() => doAction("cancel")}
              disabled={actionLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
