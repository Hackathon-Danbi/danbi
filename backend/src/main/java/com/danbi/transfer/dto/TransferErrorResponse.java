package com.danbi.transfer.dto;

import com.danbi.transfer.entity.RiskReason;
import java.util.List;

public record TransferErrorResponse(
	String code,
	String message,
	List<RiskReason> reasons
) {
}
