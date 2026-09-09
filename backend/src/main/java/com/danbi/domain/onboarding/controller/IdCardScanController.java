package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.ConfirmIdCardRequest;
import com.danbi.domain.onboarding.dto.ConfirmIdCardResponse;
import com.danbi.domain.onboarding.dto.ScanIdCardResponse;
import com.danbi.domain.onboarding.entity.IdCardType;
import com.danbi.domain.onboarding.service.IdCardScanService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/onboarding/certificate/id-card")
@RequiredArgsConstructor
@Validated
public class IdCardScanController {

	private final IdCardScanService idCardScanService;

	@PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	public ScanIdCardResponse scan(
		@RequestParam @NotBlank String issuanceId,
		@RequestParam IdCardType idCardType,
		@RequestPart("image") MultipartFile image
	) {
		return idCardScanService.scan(issuanceId, idCardType, image);
	}

	@PostMapping("/confirm")
	public ConfirmIdCardResponse confirm(
		@Valid @RequestBody ConfirmIdCardRequest request
	) {
		return idCardScanService.confirm(request);
	}
}
