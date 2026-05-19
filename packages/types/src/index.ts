export type AgreementStatus = "pending" | "active" | "completed" | "cancelled";

export interface Agreement {
  id: string;
  initiator: string;       // Stellar address
  counterparty: string;    // Stellar address
  terms: string;
  status: AgreementStatus;
  createdAt: number;       // Unix timestamp (seconds)
  updatedAt: number;
}

export interface CreateAgreementRequest {
  initiator: string;
  counterparty: string;
  terms: string;
}

export interface AgreementActionRequest {
  caller: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface AgreementListResponse {
  agreements: Agreement[];
  total: number;
}
