package com.danbi.domain.transfer.controller;

import com.danbi.domain.transfer.dto.SaveRecipientRequest;
import com.danbi.domain.transfer.dto.SavedRecipientResponse;
import com.danbi.domain.transfer.service.TransferService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/saved-recipients")
@RequiredArgsConstructor
public class SavedRecipientController {

	private final TransferService transferService;

	/** 저장 수취인 + 최근 송금계좌 통합 목록. GET /api/saved-recipients?userId=1 */
	@GetMapping
	public List<SavedRecipientResponse> list(@RequestParam Long userId) {
		return transferService.getRecipients(userId);
	}

	/** 저장 수취인 추가. POST /api/saved-recipients */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public SavedRecipientResponse add(@RequestBody @Valid SaveRecipientRequest request) {
		return transferService.addSavedRecipient(request);
	}

	/** 저장 수취인 삭제. DELETE /api/saved-recipients/{savedRecipientId} */
	@DeleteMapping("/{savedRecipientId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long savedRecipientId) {
		transferService.deleteSavedRecipient(savedRecipientId);
	}
}
