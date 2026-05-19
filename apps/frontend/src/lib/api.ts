import type {
  Agreement,
  AgreementListResponse,
  ApiResponse,
  CreateAgreementRequest,
  AgreementActionRequest,
} from "@agreestellar/types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || "Request failed");
  return json.data;
}

export const api = {
  listAgreements: (address?: string) => {
    const qs = address ? `?address=${encodeURIComponent(address)}` : "";
    return request<AgreementListResponse>(`/agreements${qs}`);
  },

  getAgreement: (id: string) =>
    request<Agreement>(`/agreements/${id}`),

  createAgreement: (body: CreateAgreementRequest) =>
    request<Agreement>("/agreements", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  acceptAgreement: (id: string, body: AgreementActionRequest) =>
    request<Agreement>(`/agreements/${id}/accept`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  completeAgreement: (id: string, body: AgreementActionRequest) =>
    request<Agreement>(`/agreements/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  cancelAgreement: (id: string, body: AgreementActionRequest) =>
    request<Agreement>(`/agreements/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
