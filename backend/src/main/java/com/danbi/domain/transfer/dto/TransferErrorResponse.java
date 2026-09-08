package com.danbi.domain.transfer.dto;

import com.danbi.domain.transfer.entity.RiskReason;
import java.util.List;

public record TransferErrorResponse(
	String code,
	String message,
	List<RiskReason> reasons
) {
}
