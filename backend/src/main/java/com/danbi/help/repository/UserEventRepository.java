package com.danbi.help.repository;

import com.danbi.help.entity.UserEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserEventRepository extends JpaRepository<UserEvent, Long> {

	List<UserEvent> findByFlowSessionIdOrderByCreatedAtAsc(String flowSessionId);
}
