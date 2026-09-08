package com.danbi.domain.help.dto;

import com.danbi.domain.help.entity.FlowType;
import com.danbi.domain.help.entity.HelpSignal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record HelpTriggerRequest(
	@NotNull Long userId,
	@NotBlank String flowSessionId,
	@NotNull FlowType flowType,
	@NotBlank String screenCode,
	@NotNull HelpSignal signal
) {
}
