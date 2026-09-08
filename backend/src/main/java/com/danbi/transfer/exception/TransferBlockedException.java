package com.danbi.transfer.exception;

import com.danbi.transfer.entity.RiskReason;
import java.util.List;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/** 송금 플로우에서 발생하는 도메인 거부(비밀번호 오류, 안심확인 필요, 차단 등). */
@Getter
public class TransferBlockedException extends RuntimeException {

	private final HttpStatus status;
	private final String code;
	private final List<RiskReason> reasons;

	public TransferBlockedException(HttpStatus status, String code, String message, List<RiskReason> reasons) {
		super(message);
		this.status = status;
		this.code = code;
		this.reasons = reasons == null ? List.of() : List.copyOf(reasons);
	}
}
