package com.danbi.domain.practice.service;

import com.danbi.domain.practice.dto.CreatePracticeSessionRequest;
import com.danbi.domain.practice.dto.PracticeAccountResponse;
import com.danbi.domain.practice.dto.PracticeAccountsResponse;
import com.danbi.domain.practice.dto.PracticeMissionResponse;
import com.danbi.domain.practice.dto.PracticeSessionResponse;
import com.danbi.domain.practice.dto.PracticeSessionResultResponse;
import com.danbi.domain.practice.dto.PracticeTransferRequest;
import com.danbi.domain.practice.dto.PracticeTransferResultResponse;
import com.danbi.domain.practice.entity.PracticeMission;
import com.danbi.domain.practice.entity.PracticeSession;
import com.danbi.domain.practice.repository.PracticeMissionRepository;
import com.danbi.domain.practice.repository.PracticeSessionRepository;
import com.danbi.domain.transfer.entity.SavedRecipient;
import com.danbi.domain.transfer.repository.SavedRecipientRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * 연습 모드 송금 세션. 실제 돈은 움직이지 않고, 완료 시 미션 배점만 기록해
 * FE "나의 금융 독립" 점수 동기화(best-effort)에 응답한다.
 * 로그인 도입 전이므로 연습용 수취인 목록은 시연 사용자({@code userId=1})의 저장 수취인을 그대로 쓴다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticeSessionService {

	private static final String SESSION_ID_PREFIX = "ps_";
	private static final long DEMO_USER_ID = 1L;
	private static final List<PracticeAccountResponse> FALLBACK_ACCOUNTS = List.of(
		new PracticeAccountResponse(9001L, "이영희", "088", "11022334455"),
		new PracticeAccountResponse(9002L, "박철수", "020", "1002345678901"),
		new PracticeAccountResponse(9003L, "김순자", "004", "12345678901234")
	);

	private final PracticeSessionRepository sessionRepository;
	private final PracticeMissionRepository missionRepository;
	private final SavedRecipientRepository savedRecipientRepository;
	private final Clock clock;

	@Transactional
	public PracticeSessionResponse create(CreatePracticeSessionRequest request) {
		PracticeMission mission = requireMission(request.missionId());
		PracticeSession session = sessionRepository.save(PracticeSession.start(
			SESSION_ID_PREFIX + UUID.randomUUID().toString().replace("-", ""),
			mission.getMissionId(),
			request.mode(),
			request.inputType(),
			LocalDateTime.now(clock)
		));
		return PracticeSessionResponse.of(session, PracticeMissionResponse.from(mission));
	}

	public PracticeAccountsResponse listPracticeAccounts() {
		List<SavedRecipient> saved = savedRecipientRepository.findByUserIdOrderBySavedRecipientIdDesc(DEMO_USER_ID);
		if (saved.isEmpty()) {
			return new PracticeAccountsResponse(FALLBACK_ACCOUNTS);
		}
		return new PracticeAccountsResponse(saved.stream()
			.map(recipient -> new PracticeAccountResponse(
				recipient.getSavedRecipientId(),
				recipient.getRecipientName(),
				recipient.getRecipientBankCode(),
				recipient.getRecipientAccountNumber()))
			.toList());
	}

	@Transactional
	public PracticeTransferResultResponse completeTransfer(String sessionId, PracticeTransferRequest request) {
		PracticeSession session = requireSession(sessionId);
		PracticeMission mission = requireMission(session.getMissionId());
		session.complete(mission.getScoreReward(), LocalDateTime.now(clock));
		return PracticeTransferResultResponse.of(session.isPracticeCompleted(), session.getEarnedScore());
	}

	public PracticeSessionResultResponse getResult(String sessionId) {
		PracticeSession session = requireSession(sessionId);
		return PracticeSessionResultResponse.of(session.isPracticeCompleted(), session.getEarnedScore());
	}

	private PracticeSession requireSession(String sessionId) {
		return sessionRepository.findById(sessionId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "연습 세션을 찾을 수 없습니다."));
	}

	private PracticeMission requireMission(Long missionId) {
		return missionRepository.findById(missionId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "연습을 찾을 수 없습니다: " + missionId));
	}
}
