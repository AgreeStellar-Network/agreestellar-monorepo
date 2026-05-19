import express, { Request, Response, NextFunction } from "express";
import {
  Agreement,
  AgreementStatus,
  CreateAgreementRequest,
  AgreementActionRequest,
  ApiResponse,
  AgreementListResponse,
} from "@agreestellar/types";

const app = express();
const PORT = process.env.PORT || 3001;
const CONTRACT_ID = process.env.CONTRACT_ID || "";
const STELLAR_NETWORK = process.env.STELLAR_NETWORK || "testnet";
const STELLAR_RPC_URL =
  process.env.STELLAR_RPC_URL ||
  "https://soroban-testnet.stellar.org";

app.use(express.json());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

// ── In-memory store (replace with DB / on-chain reads in production) ──────────
const agreements = new Map<string, Agreement>();
let counter = 0;

function nextId(): string {
  return String(++counter);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function now(): number {
  return Math.floor(Date.now() / 1000);
}

function ok<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { data };
  res.status(status).json(body);
}

function fail(res: Response, message: string, status = 400): void {
  const body: ApiResponse<null> = { data: null, error: message };
  res.status(status).json(body);
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    network: STELLAR_NETWORK,
    contractId: CONTRACT_ID || "not-configured",
    rpcUrl: STELLAR_RPC_URL,
  });
});

/** POST /agreements — create a new agreement */
app.post("/agreements", (req: Request, res: Response) => {
  const body = req.body as CreateAgreementRequest;

  if (!body.initiator || !body.counterparty || !body.terms) {
    return fail(res, "initiator, counterparty, and terms are required");
  }
  if (body.initiator === body.counterparty) {
    return fail(res, "initiator and counterparty must be different addresses");
  }

  const agreement: Agreement = {
    id: nextId(),
    initiator: body.initiator,
    counterparty: body.counterparty,
    terms: body.terms,
    status: "pending",
    createdAt: now(),
    updatedAt: now(),
  };

  agreements.set(agreement.id, agreement);
  ok(res, agreement, 201);
});

/** GET /agreements — list all agreements (optionally filter by address) */
app.get("/agreements", (req: Request, res: Response) => {
  const { address, status } = req.query as {
    address?: string;
    status?: AgreementStatus;
  };

  let list = Array.from(agreements.values());

  if (address) {
    list = list.filter(
      (a) => a.initiator === address || a.counterparty === address
    );
  }
  if (status) {
    list = list.filter((a) => a.status === status);
  }

  const response: AgreementListResponse = {
    agreements: list,
    total: list.length,
  };
  ok(res, response);
});

/** GET /agreements/:id — get a single agreement */
app.get("/agreements/:id", (req: Request, res: Response) => {
  const agreement = agreements.get(req.params.id);
  if (!agreement) return fail(res, "Agreement not found", 404);
  ok(res, agreement);
});

/** POST /agreements/:id/accept — counterparty accepts */
app.post("/agreements/:id/accept", (req: Request, res: Response) => {
  const agreement = agreements.get(req.params.id);
  if (!agreement) return fail(res, "Agreement not found", 404);

  const { caller } = req.body as AgreementActionRequest;
  if (!caller) return fail(res, "caller is required");
  if (agreement.counterparty !== caller)
    return fail(res, "Only the counterparty can accept", 403);
  if (agreement.status !== "pending")
    return fail(res, `Cannot accept an agreement with status: ${agreement.status}`);

  agreement.status = "active";
  agreement.updatedAt = now();
  ok(res, agreement);
});

/** POST /agreements/:id/complete — either party completes */
app.post("/agreements/:id/complete", (req: Request, res: Response) => {
  const agreement = agreements.get(req.params.id);
  if (!agreement) return fail(res, "Agreement not found", 404);

  const { caller } = req.body as AgreementActionRequest;
  if (!caller) return fail(res, "caller is required");
  if (agreement.initiator !== caller && agreement.counterparty !== caller)
    return fail(res, "Not a party to this agreement", 403);
  if (agreement.status !== "active")
    return fail(res, `Cannot complete an agreement with status: ${agreement.status}`);

  agreement.status = "completed";
  agreement.updatedAt = now();
  ok(res, agreement);
});

/** POST /agreements/:id/cancel — either party cancels */
app.post("/agreements/:id/cancel", (req: Request, res: Response) => {
  const agreement = agreements.get(req.params.id);
  if (!agreement) return fail(res, "Agreement not found", 404);

  const { caller } = req.body as AgreementActionRequest;
  if (!caller) return fail(res, "caller is required");
  if (agreement.initiator !== caller && agreement.counterparty !== caller)
    return fail(res, "Not a party to this agreement", 403);
  if (agreement.status !== "pending" && agreement.status !== "active")
    return fail(res, `Cannot cancel an agreement with status: ${agreement.status}`);

  agreement.status = "cancelled";
  agreement.updatedAt = now();
  ok(res, agreement);
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  fail(res, "Not found", 404);
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  fail(res, "Internal server error", 500);
});

app.listen(PORT, () => {
  console.log(`✅ AgreeStellar backend running on port ${PORT}`);
  console.log(`   Network : ${STELLAR_NETWORK}`);
  console.log(`   Contract: ${CONTRACT_ID || "(not configured)"}`);
});

export default app;
