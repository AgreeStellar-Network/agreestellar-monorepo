#![no_std]
use soroban_sdk::{contract, contractimpl, log, Env, Symbol, String};

#[contract]
pub struct AgreeStellarContract;

#[contractimpl]
impl AgreeStellarContract {
    pub fn hello(env: Env, to: String) -> Symbol {
        log!(&env, "Hello, {}", to);
        Symbol::new(&env, "hello")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, String};

    #[test]
    fn test_hello() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AgreeStellarContract);
        let client = AgreeStellarContractClient::new(&env, &contract_id);
        let result = client.hello(&String::from_str(&env, "World"));
        assert_eq!(result, Symbol::new(&env, "hello"));
    }
}
