package com.danbi.domain.transfer.dto;

import com.danbi.domain.transfer.entity.RiskReason;
import java.util.List;

public record RiskCheckResponse(
	Long accountId,
	long amount,
	boolean risky,
	boolean blocked,
	boolean requiresSafetyCheck,
	boolean recipientIsNew,
	List<RiskReason> reasons
) {
}
