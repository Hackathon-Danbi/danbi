package com.danbi.domain.practice.controller;

import com.danbi.domain.practice.dto.CompleteTransferDifficultyRequest;
import com.danbi.domain.practice.dto.TransferDifficultyRequest;
import com.danbi.domain.practice.dto.TransferDifficultyResponse;
import com.danbi.domain.practice.service.PracticeService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 맞춤 복습("다시 연습해볼까요?") 신호 API.
 * 실제 송금 플로우가 막힌 지점을 적재하고, 허브에서 복습 완료를 표시한다.
 */
@RestController
@RequestMapping("/api/practice/transfer-difficulties")
@RequiredArgsConstructor
public class TransferDifficultyController {

	private final PracticeService practiceService;

	/** 사용자 복습 신호 전체 목록(최근순). GET ...?userId=1 */
	@GetMapping
	public List<TransferDifficultyResponse> list(@RequestParam(defaultValue = "1") Long userId) {
		return practiceService.listDifficulties(userId);
	}

	/**
	 * 송금에서 막힌 지점 적재.
	 * POST ...?userId=1  body: { "step": "account", "reason": "inputError", "transferId": 12 }
	 */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public TransferDifficultyResponse record(
		@RequestParam(defaultValue = "1") Long userId,
		@RequestBody @Valid TransferDifficultyRequest request) {
		return practiceService.recordDifficulty(userId, request);
	}

	/**
	 * 복습 완료 처리.
	 * PATCH .../{difficultyId}?userId=1  body: { "completed": true }
	 */
	@PatchMapping("/{difficultyId}")
	public TransferDifficultyResponse complete(
		@RequestParam(defaultValue = "1") Long userId,
		@PathVariable Long difficultyId,
		@RequestBody @Valid CompleteTransferDifficultyRequest request) {
		return practiceService.completeDifficulty(userId, difficultyId, Boolean.TRUE.equals(request.completed()));
	}
}
