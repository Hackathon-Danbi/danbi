package com.danbi.domain.practice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 오늘의 금융 한 문제 문제은행. O/X 형만 다룬다.
 * {@code correctAnswer == true} 는 정답이 O, false 는 정답이 X 라는 뜻.
 */
@Entity
@Table(name = "financial_questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class FinancialQuestion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "question_id")
	private Long questionId;

	@Column(name = "question_text", nullable = false, length = 255)
	private String questionText;

	/** true = 정답 O, false = 정답 X. */
	@Column(name = "correct_answer", nullable = false)
	private boolean correctAnswer;

	@Column(name = "explanation", length = 500)
	private String explanation;

	/** 선택 인덱스(0 = O, 1 = X)가 정답인지. */
	public boolean isCorrect(int selectedIndex) {
		return selectedIndex == correctIndex();
	}

	/** 정답 인덱스. 0 = O, 1 = X. */
	public int correctIndex() {
		return correctAnswer ? 0 : 1;
	}
}
