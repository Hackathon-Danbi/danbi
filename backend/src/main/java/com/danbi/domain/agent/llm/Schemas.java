package com.danbi.domain.agent.llm;

import java.util.List;
import java.util.Map;

public final class Schemas {
    private Schemas() {}
    public static final Map<String, Object> DECISION = object(Map.of(
            "intent", Map.of("type", "string", "enum", List.of("BALANCE", "TRANSACTIONS", "TRANSFER",
                    "SIGNUP", "PRODUCT", "PRACTICE", "COACH", "CANCEL", "OTHER")),
            "recipient", Map.of("type", List.of("string", "null")),
            "amount", Map.of("type", List.of("integer", "null")),
            "startDate", Map.of("type", List.of("string", "null")),
            "endDate", Map.of("type", List.of("string", "null")),
            "unclear", Map.of("type", "boolean")));
    public static final Map<String, Object> ANSWER = object(Map.of(
            "supported", Map.of("type", "boolean"), "text", Map.of("type", "string"),
            "sourceIds", Map.of("type", "array", "items", Map.of("type", "string"))));

    private static Map<String, Object> object(Map<String, Object> fields) {
        return Map.of("type", "object", "properties", fields,
                "required", List.copyOf(fields.keySet()), "additionalProperties", false);
    }
}
