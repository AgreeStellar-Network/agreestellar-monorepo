#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Map, String, Symbol, Vec,
};

// ── Storage keys ──────────────────────────────────────────────────────────────
const AGREEMENTS: Symbol = symbol_short!("AGREEMTS");
const COUNTER: Symbol = symbol_short!("COUNTER");

// ── Data types ────────────────────────────────────────────────────────────────
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum AgreementStatus {
    Pending,
    Active,
    Completed,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Agreement {
    pub id: u64,
    pub initiator: Address,
    pub counterparty: Address,
    pub terms: String,
    pub status: AgreementStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

// ── Contract ──────────────────────────────────────────────────────────────────
#[contract]
pub struct AgreeStellarContract;

#[contractimpl]
impl AgreeStellarContract {
    /// Create a new agreement between initiator and counterparty.
    /// Returns the new agreement ID.
    pub fn create_agreement(
        env: Env,
        initiator: Address,
        counterparty: Address,
        terms: String,
    ) -> u64 {
        initiator.require_auth();

        let id: u64 = env.storage().instance().get(&COUNTER).unwrap_or(0) + 1;
        let now = env.ledger().timestamp();

        let agreement = Agreement {
            id,
            initiator: initiator.clone(),
            counterparty,
            terms,
            status: AgreementStatus::Pending,
            created_at: now,
            updated_at: now,
        };

        let mut agreements: Map<u64, Agreement> = env
            .storage()
            .instance()
            .get(&AGREEMENTS)
            .unwrap_or(Map::new(&env));

        agreements.set(id, agreement);
        env.storage().instance().set(&AGREEMENTS, &agreements);
        env.storage().instance().set(&COUNTER, &id);

        env.events().publish(
            (symbol_short!("created"), initiator),
            id,
        );

        id
    }

    /// Counterparty accepts the agreement, moving it to Active.
    pub fn accept_agreement(env: Env, agreement_id: u64, counterparty: Address) {
        counterparty.require_auth();

        let mut agreements: Map<u64, Agreement> = env
            .storage()
            .instance()
            .get(&AGREEMENTS)
            .unwrap_or(Map::new(&env));

        let mut agreement = agreements.get(agreement_id).unwrap();
        assert!(
            agreement.counterparty == counterparty,
            "Only the counterparty can accept"
        );
        assert!(
            agreement.status == AgreementStatus::Pending,
            "Agreement is not pending"
        );

        agreement.status = AgreementStatus::Active;
        agreement.updated_at = env.ledger().timestamp();
        agreements.set(agreement_id, agreement);
        env.storage().instance().set(&AGREEMENTS, &agreements);

        env.events().publish(
            (symbol_short!("accepted"), counterparty),
            agreement_id,
        );
    }

    /// Either party can mark the agreement as completed.
    pub fn complete_agreement(env: Env, agreement_id: u64, caller: Address) {
        caller.require_auth();

        let mut agreements: Map<u64, Agreement> = env
            .storage()
            .instance()
            .get(&AGREEMENTS)
            .unwrap_or(Map::new(&env));

        let mut agreement = agreements.get(agreement_id).unwrap();
        assert!(
            agreement.initiator == caller || agreement.counterparty == caller,
            "Not a party to this agreement"
        );
        assert!(
            agreement.status == AgreementStatus::Active,
            "Agreement is not active"
        );

        agreement.status = AgreementStatus::Completed;
        agreement.updated_at = env.ledger().timestamp();
        agreements.set(agreement_id, agreement);
        env.storage().instance().set(&AGREEMENTS, &agreements);

        env.events().publish(
            (symbol_short!("completed"), caller),
            agreement_id,
        );
    }

    /// Either party can cancel a Pending or Active agreement.
    pub fn cancel_agreement(env: Env, agreement_id: u64, caller: Address) {
        caller.require_auth();

        let mut agreements: Map<u64, Agreement> = env
            .storage()
            .instance()
            .get(&AGREEMENTS)
            .unwrap_or(Map::new(&env));

        let mut agreement = agreements.get(agreement_id).unwrap();
        assert!(
            agreement.initiator == caller || agreement.counterparty == caller,
            "Not a party to this agreement"
        );
        assert!(
            agreement.status == AgreementStatus::Pending
                || agreement.status == AgreementStatus::Active,
            "Agreement cannot be cancelled"
        );

        agreement.status = AgreementStatus::Cancelled;
        agreement.updated_at = env.ledger().timestamp();
        agreements.set(agreement_id, agreement);
        env.storage().instance().set(&AGREEMENTS, &agreements);

        env.events().publish(
            (symbol_short!("cancelled"), caller),
            agreement_id,
        );
    }

    /// Fetch a single agreement by ID.
    pub fn get_agreement(env: Env, agreement_id: u64) -> Agreement {
        let agreements: Map<u64, Agreement> = env
            .storage()
            .instance()
            .get(&AGREEMENTS)
            .unwrap_or(Map::new(&env));
        agreements.get(agreement_id).unwrap()
    }

    /// Return all agreement IDs for a given address (as initiator or counterparty).
    pub fn get_agreements_for(env: Env, address: Address) -> Vec<u64> {
        let agreements: Map<u64, Agreement> = env
            .storage()
            .instance()
            .get(&AGREEMENTS)
            .unwrap_or(Map::new(&env));

        let mut result = Vec::new(&env);
        for (id, agreement) in agreements.iter() {
            if agreement.initiator == address || agreement.counterparty == address {
                result.push_back(id);
            }
        }
        result
    }

    /// Return the total number of agreements created.
    pub fn get_count(env: Env) -> u64 {
        env.storage().instance().get(&COUNTER).unwrap_or(0)
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    fn setup() -> (Env, AgreeStellarContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, AgreeStellarContract);
        let client = AgreeStellarContractClient::new(&env, &contract_id);
        (env, client)
    }

    #[test]
    fn test_create_agreement() {
        let (env, client) = setup();
        let initiator = Address::generate(&env);
        let counterparty = Address::generate(&env);
        let terms = String::from_str(&env, "Pay 100 XLM upon delivery");

        let id = client.create_agreement(&initiator, &counterparty, &terms);
        assert_eq!(id, 1);
        assert_eq!(client.get_count(), 1);

        let agreement = client.get_agreement(&id);
        assert_eq!(agreement.status, AgreementStatus::Pending);
        assert_eq!(agreement.initiator, initiator);
    }

    #[test]
    fn test_full_lifecycle() {
        let (env, client) = setup();
        let initiator = Address::generate(&env);
        let counterparty = Address::generate(&env);
        let terms = String::from_str(&env, "Service agreement terms");

        let id = client.create_agreement(&initiator, &counterparty, &terms);

        client.accept_agreement(&id, &counterparty);
        assert_eq!(client.get_agreement(&id).status, AgreementStatus::Active);

        client.complete_agreement(&id, &initiator);
        assert_eq!(client.get_agreement(&id).status, AgreementStatus::Completed);
    }

    #[test]
    fn test_cancel_pending() {
        let (env, client) = setup();
        let initiator = Address::generate(&env);
        let counterparty = Address::generate(&env);
        let terms = String::from_str(&env, "Terms");

        let id = client.create_agreement(&initiator, &counterparty, &terms);
        client.cancel_agreement(&id, &initiator);
        assert_eq!(client.get_agreement(&id).status, AgreementStatus::Cancelled);
    }

    #[test]
    fn test_get_agreements_for() {
        let (env, client) = setup();
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        let carol = Address::generate(&env);
        let terms = String::from_str(&env, "Terms");

        client.create_agreement(&alice, &bob, &terms);
        client.create_agreement(&carol, &alice, &terms);
        client.create_agreement(&bob, &carol, &terms);

        let alice_agreements = client.get_agreements_for(&alice);
        assert_eq!(alice_agreements.len(), 2); // alice is initiator of 1, counterparty of 1
    }
}
