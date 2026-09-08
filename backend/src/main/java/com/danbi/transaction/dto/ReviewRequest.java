package com.danbi.transaction.dto;

import com.danbi.transaction.entity.ReviewStatus;
import jakarta.validation.constraints.NotNull;

public record ReviewRequest(
	@NotNull ReviewStatus reviewStatus
) {
}
