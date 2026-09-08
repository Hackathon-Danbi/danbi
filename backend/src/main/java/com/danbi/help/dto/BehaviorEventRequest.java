package com.danbi.help.dto;

import com.danbi.help.entity.EventType;
import com.danbi.help.entity.FlowType;
import com.danbi.help.entity.HelpStage;
import com.danbi.help.entity.HelpUserResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BehaviorEventRequest(
	@NotNull Long userId,
	@NotBlank @Size(max = 36) String flowSessionId,
	@NotNull FlowType flowType,
	@NotBlank @Size(max = 50) String screenCode,
	@NotNull EventType eventType,
	@Size(max = 50) String reasonCode,
	@Size(max = 255) String eventValue,
	Long transferId,
	HelpStage helpStage,
	HelpUserResponse userResponse
) {
}
