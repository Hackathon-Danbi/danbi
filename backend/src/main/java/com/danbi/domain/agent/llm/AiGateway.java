package com.danbi.domain.agent.llm;

import java.util.List;
import java.util.Map;

public interface AiGateway {
    <T> T structured(String prompt, Object input, Map<String, Object> schema, Class<T> type);
    List<List<Double>> embed(List<String> texts);
    String transcribe(byte[] audio, String extension);
    byte[] speech(String text);
}
