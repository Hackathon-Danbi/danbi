package com.danbi.domain.agent.tools;

/** Expected user-correctable validation failure, distinct from backend/provider outages. */
public class BankingValidationException extends RuntimeException {
    public BankingValidationException(String message) { super(message); }
}
