package com.danbi.transfer.dto;

import com.danbi.transfer.entity.RiskReason;
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
