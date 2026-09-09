package com.danbi.domain.agent.llm;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class Prompts {
    public String load(String name) {
        try {
            return new ClassPathResource("agent/prompts/" + name + ".txt")
                    .getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) { throw new IllegalStateException("Missing agent prompt: " + name, e); }
    }
}
