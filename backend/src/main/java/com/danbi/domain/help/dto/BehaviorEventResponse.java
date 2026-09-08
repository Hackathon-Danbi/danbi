package com.danbi.domain.help.dto;

import com.danbi.domain.help.entity.EventType;
import com.danbi.domain.help.entity.FlowType;
import com.danbi.domain.help.entity.HelpStage;
import com.danbi.domain.help.entity.HelpUserResponse;
import com.danbi.domain.help.entity.UserEvent;
import java.time.LocalDateTime;

public record BehaviorEventResponse(
	Long eventId,
	Long userId,
	Long transferId,
	String flowSessionId,
	FlowType flowType,
	String screenCode,
	EventType eventType,
	String reasonCode,
	String eventValue,
	HelpStage helpStage,
	HelpUserResponse userResponse,
	LocalDateTime createdAt
) {

	public static BehaviorEventResponse from(UserEvent e) {
		return new BehaviorEventResponse(
			e.getEventId(),
			e.getUserId(),
			e.getTransferId(),
			e.getFlowSessionId(),
			e.getFlowType(),
			e.getScreenCode(),
			e.getEventType(),
			e.getReasonCode(),
			e.getEventValue(),
			e.getHelpStage(),
			e.getUserResponse(),
			e.getCreatedAt()
		);
	}
}
