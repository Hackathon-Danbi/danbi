package com.danbi.domain.transaction.dto;

import com.danbi.domain.transaction.entity.ReviewStatus;
import jakarta.validation.constraints.NotNull;

public record ReviewRequest(
	@NotNull ReviewStatus reviewStatus
) {
}
