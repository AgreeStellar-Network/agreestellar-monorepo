"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Agreement } from "@agreestellar/types";
import { api } from "../lib/api";

function StatusBadge({ status }: { status: Agreement["status"] }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function AgreementCard({ agreement }: { agreement: Agreement }) {
  const date = new Date(agreement.createdAt * 1000).toLocaleDateString();
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Agreement #{agreement.id}</h2>
          <p style={{ marginTop: "0.5rem" }}>{agreement.terms}</p>
          <div className="meta">
            <span className="address">Initiator: {agreement.initiator}</span>
            <br />
            <span className="address">Counterparty: {agreement.counterparty}</span>
            <br />
            Created: {date}
          </div>
        </div>
        <StatusBadge status={agreement.status} />
      </div>
      <div className="actions">
        <Link href={`/agreements/${agreement.id}`} className="btn btn-ghost">
          View Details →
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listAgreements()
      .then((res) => setAgreements(res.agreements))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">Agreements</h1>
          <p className="page-subtitle">All agreements on the Stellar testnet</p>
        </div>
        <Link href="/new" className="btn btn-primary">
          + New Agreement
        </Link>
      </div>

      {loading && <p className="empty">Loading agreements…</p>}
      {error && <p className="error-msg">Error: {error}</p>}
      {!loading && !error && agreements.length === 0 && (
        <div className="empty">
          <p>No agreements yet.</p>
          <Link href="/new" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Create the first one
          </Link>
        </div>
      )}
      {agreements.map((a) => (
        <AgreementCard key={a.id} agreement={a} />
      ))}
    </>
  );
}
