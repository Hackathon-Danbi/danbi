package com.danbi.domain.transfer.exception;

import com.danbi.domain.transfer.controller.SavedRecipientController;
import com.danbi.domain.transfer.controller.TransferController;
import com.danbi.domain.transfer.dto.TransferErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = {TransferController.class, SavedRecipientController.class})
public class TransferExceptionHandler {

	@ExceptionHandler(TransferBlockedException.class)
	public ResponseEntity<TransferErrorResponse> handleBlocked(TransferBlockedException e) {
		return ResponseEntity.status(e.getStatus())
			.body(new TransferErrorResponse(e.getCode(), e.getMessage(), e.getReasons()));
	}
}
