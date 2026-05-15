export interface Agreement {
  id: string;
  parties: string[];
  terms: string;
  status: "pending" | "active" | "completed" | "cancelled";
  createdAt: number;
}
