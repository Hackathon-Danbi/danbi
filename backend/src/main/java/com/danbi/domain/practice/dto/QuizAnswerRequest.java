package com.danbi.domain.practice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * 오늘의 금융 한 문제 응답 저장.
 * {@code answeredIndex} 0 = O, 1 = X (프론트 quizRecord 와 동일).
 * {@code date} 생략 시 서버 오늘 날짜.
 */
public record QuizAnswerRequest(
	@NotNull Long questionId,
	@NotNull @Min(0) @Max(1) Integer answeredIndex,
	LocalDate date
) {
}
