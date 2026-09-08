package com.danbi.domain.agent.tools;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/** Deliberately has no reference to TransferService or customer repositories. */
@Component
public class DemoBankTools {
    private final Clock clock;
    public DemoBankTools(Clock clock) { this.clock = clock; }
    public long balance() { return 150_000; }
    public List<Map<String, String>> recipients(String name) {
        return List.of(
                Map.of("id", "r1", "name", "김민수", "alias", "민수", "account", "***1234"),
                Map.of("id", "r2", "name", "이지영", "alias", "지영", "account", "***5678"),
                Map.of("id", "r3", "name", "박영희", "alias", "영희", "account", "***1111"),
                Map.of("id", "r4", "name", "김영희", "alias", "영희", "account", "***2222"))
                .stream().filter(r -> r.get("name").equals(name) || r.get("alias").equals(name)).toList();
    }
    public List<Map<String, Object>> transactions(LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now(clock);
        List<Map<String, Object>> rows = List.of(
                Map.of("date", today.minusDays(1).toString(), "description", "연습 마트", "amount", -12000),
                Map.of("date", today.minusDays(3).toString(), "description", "연습 입금", "amount", 50000));
        return rows.stream().filter(row -> {
            LocalDate date = LocalDate.parse((String) row.get("date"));
            return !date.isBefore(from) && !date.isAfter(to);
        }).toList();
    }
}
