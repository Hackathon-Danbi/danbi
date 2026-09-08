package com.danbi.domain.transfer.controller;

import com.danbi.domain.transfer.dto.AccountHolderRequest;
import com.danbi.domain.transfer.dto.AccountHolderResponse;
import com.danbi.domain.transfer.dto.BankResponse;
import com.danbi.domain.transfer.dto.RiskCheckResponse;
import com.danbi.domain.transfer.dto.TransferExecuteRequest;
import com.danbi.domain.transfer.dto.TransferResponse;
import com.danbi.domain.transfer.service.TransferService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transfer")
@RequiredArgsConstructor
public class TransferController {

	private final TransferService transferService;

	/** 은행 선택 목록. GET /api/transfer/banks */
	@GetMapping("/banks")
	public List<BankResponse> banks() {
		return transferService.listBanks();
	}

	/** 예금주 조회. POST /api/transfer/account-holder  body: { bankCode, accountNumber } */
	@PostMapping("/account-holder")
	public AccountHolderResponse accountHolder(@RequestBody @Valid AccountHolderRequest request) {
		return transferService.lookupAccountHolder(request.bankCode(), request.accountNumber());
	}

	/**
	 * 위험 점검.
	 * GET /api/transfer/risk-check?accountId=1&amount=800000&recipientAccountNumber=...
	 *   &isNewAccount=false&isInCall=false&requestedByCaller=false&phishingKeywordDetected=false
	 */
	@GetMapping("/risk-check")
	public RiskCheckResponse riskCheck(
		@RequestParam Long accountId,
		@RequestParam long amount,
		@RequestParam(required = false) String recipientAccountNumber,
		@RequestParam(defaultValue = "false") boolean isNewAccount,
		@RequestParam(defaultValue = "false") boolean isInCall,
		@RequestParam(defaultValue = "false") boolean requestedByCaller,
		@RequestParam(defaultValue = "false") boolean phishingKeywordDetected) {
		return transferService.riskCheck(accountId, amount, recipientAccountNumber,
			isNewAccount, isInCall, requestedByCaller, phishingKeywordDetected);
	}

	/** 송금 실행. POST /api/transfer/execute */
	@PostMapping("/execute")
	public TransferResponse execute(@RequestBody @Valid TransferExecuteRequest request) {
		return transferService.execute(request);
	}

	/** 송금 단건 조회. GET /api/transfer/{transferId} */
	@GetMapping("/{transferId:\\d+}")
	public TransferResponse getTransfer(@PathVariable Long transferId) {
		return transferService.getTransfer(transferId);
	}
}
