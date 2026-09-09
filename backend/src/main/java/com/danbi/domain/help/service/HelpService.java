package com.danbi.domain.help.service;

import com.danbi.domain.help.dto.AgentAvailabilityResponse;
import com.danbi.domain.help.dto.BehaviorEventRequest;
import com.danbi.domain.help.dto.BehaviorEventResponse;
import com.danbi.domain.help.dto.HelpSignalCounts;
import com.danbi.domain.help.dto.HelpTriggerResponse;
import com.danbi.domain.help.entity.EventType;
import com.danbi.domain.help.entity.FlowType;
import com.danbi.domain.help.entity.HelpSignal;
import com.danbi.domain.help.entity.HelpStage;
import com.danbi.domain.help.entity.HelpUserResponse;
import com.danbi.domain.help.entity.UserEvent;
import com.danbi.domain.help.repository.UserEventRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HelpService {

	private static final int IRRELEVANT_CLICK_THRESHOLD = 3;
	private static final int INPUT_ERROR_THRESHOLD = 2;
	private static final int VOICE_FAIL_THRESHOLD = 3;
	private static final int SCREEN_REENTRY_THRESHOLD = 3;
	private static final Duration REJECT_SUPPRESSION = Duration.ofSeconds(30);
	/** HIGHLIGHT/VOICE 노출 후 다음 단계로 올라가기 위한 무진행 대기 시간. */
	private static final Duration ESCALATION_INACTIVITY = Duration.ofSeconds(20);

	private final UserEventRepository userEventRepository;
	private final Clock clock;

	@Value("${danbi.help.agent.opens-at:09:00}")
	private String opensAt;

	@Value("${danbi.help.agent.closes-at:18:00}")
	private String closesAt;

	@Value("${danbi.help.agent.weekdays-only:true}")
	private boolean weekdaysOnly;

	@Value("${danbi.help.agent.support-phone:1588-0000}")
	private String supportPhone;

	/** 행동 이벤트 적재. 이후 trigger 판단의 집계 근거가 된다. */
	@Transactional
	public BehaviorEventResponse recordEvent(BehaviorEventRequest req) {
		UserEvent saved = userEventRepository.save(UserEvent.builder()
			.userId(req.userId())
			.transferId(req.transferId())
			.flowSessionId(req.flowSessionId())
			.flowType(req.flowType())
			.screenCode(req.screenCode())
			.eventType(req.eventType())
			.reasonCode(req.reasonCode())
			.eventValue(req.eventValue())
			.helpStage(req.helpStage())
			.userResponse(req.userResponse())
			.createdAt(LocalDateTime.now(clock))
			.build());
		return BehaviorEventResponse.from(saved);
	}

	/**
	 * 세션 누적 행동 이벤트로 최종 개입 단계를 결정한다.
	 *
	 * <p>상태 전이는 "trigger 재호출 횟수"나 "과거 누적 오류 횟수"가 아니라
	 * <b>직전 HELP_SHOWN 이후에 새로 기록된 실제 이벤트</b>로만 판단한다.
	 * <ul>
	 *   <li>미노출 → HIGHLIGHT: 현재 화면에서 LONG_STAY 이벤트 발생 / IRRELEVANT_CLICK 3 / INPUT_ERROR 2 /
	 *       VOICE_FAIL 3 / SCREEN_REENTRY 3 중 하나 충족</li>
	 *   <li>HIGHLIGHT → VOICE: HIGHLIGHT 노출 후 20초 경과 + 새 LONG_STAY 이벤트</li>
	 *   <li>VOICE → COUNSELOR: VOICE 노출 후 20초 경과 + 새 LONG_STAY, 또는 VOICE 이후 새 INPUT_ERROR /
	 *       새 VOICE_FAIL, 또는 HELP_MORE_REQUESTED</li>
	 *   <li>COUNSELOR 이후: FINAL_STAGE_ALREADY_SHOWN (재노출/추가 저장 없음)</li>
	 * </ul>
	 * 미해소 RISK_DETECTED 가 있으면 위 판단보다 먼저 SAFETY_CHECK 를 반환한다.
	 */
	@Transactional
	public HelpTriggerResponse trigger(Long userId, String flowSessionId, FlowType flowType,
			String screenCode, HelpSignal signal) {
		List<UserEvent> events = userEventRepository.findByFlowSessionIdOrderByCreatedAtAsc(flowSessionId);
		LocalDateTime now = LocalDateTime.now(clock);

		HelpSignalCounts counts = countsFor(events, screenCode);
		HelpStage previousStage = highestShownStage(events, screenCode);

		// (1) 이상 송금 안심확인이 항상 우선.
		Optional<LocalDateTime> unresolvedRiskAt = unresolvedRiskDetectedAt(events);
		if (unresolvedRiskAt.isPresent()) {
			recordSafetyCheckShownIfNeeded(userId, flowSessionId, flowType, screenCode, events, unresolvedRiskAt.get(), now);
			return new HelpTriggerResponse(true, HelpStage.SAFETY_CHECK, previousStage, screenCode, signal,
				HelpTriggerResponse.RISK_DETECTED,
				"송금을 잠시 멈추고 안전한 거래인지 확인해요.", false, false, counts);
		}

		// (2) 이미 최종 단계.
		if (previousStage == HelpStage.COUNSELOR) {
			return HelpTriggerResponse.notShown(
				HelpTriggerResponse.FINAL_STAGE_ALREADY_SHOWN, screenCode, signal, previousStage, counts);
		}

		// (3) 도움 거절 후 30초 억제 (새 INPUT_ERROR / VOICE_FAIL / HELP_MORE_REQUESTED 는 예외).
		Optional<LocalDateTime> lastRejectAt = lastRejectionAt(events, screenCode);
		if (lastRejectAt.isPresent() && Duration.between(lastRejectAt.get(), now).compareTo(REJECT_SUPPRESSION) < 0) {
			boolean override = signal == HelpSignal.HELP_MORE_REQUESTED
				|| hasNewEventAfter(events, screenCode, EventType.INPUT_ERROR, lastRejectAt.get())
				|| hasNewEventAfter(events, screenCode, EventType.VOICE_FAIL, lastRejectAt.get());
			if (!override) {
				return HelpTriggerResponse.notShown(
					HelpTriggerResponse.SUPPRESSED_AFTER_REJECT, screenCode, signal, previousStage, counts);
			}
		}

		// (4) 단계 전이.
		HelpStage nextStage = decideNextStage(previousStage, signal, events, screenCode, counts, now);
		if (nextStage == null) {
			return HelpTriggerResponse.notShown(
				HelpTriggerResponse.THRESHOLD_NOT_MET, screenCode, signal, previousStage, counts);
		}

		recordShownStage(userId, flowSessionId, flowType, screenCode, signal, nextStage, now);

		boolean counselor = nextStage == HelpStage.COUNSELOR;
		boolean agentAvailable = counselor && agentAvailability().available();
		return new HelpTriggerResponse(true, nextStage, previousStage, screenCode, signal,
			HelpTriggerResponse.SHOW, messageFor(nextStage, screenCode), counselor, agentAvailable, counts);
	}

	private HelpStage decideNextStage(HelpStage previousStage, HelpSignal signal, List<UserEvent> events,
			String screenCode, HelpSignalCounts counts, LocalDateTime now) {

		// 사용자가 직접 "도움이 더 필요해요"를 누르면 어느 단계에서든 즉시 상담원.
		if (signal == HelpSignal.HELP_MORE_REQUESTED) {
			return HelpStage.COUNSELOR;
		}

		if (previousStage == null) {
			boolean initialConditionMet =
				hasEventOnScreen(events, screenCode, EventType.LONG_STAY)
				|| counts.irrelevantClick() >= IRRELEVANT_CLICK_THRESHOLD
				|| counts.inputError() >= INPUT_ERROR_THRESHOLD
				|| counts.voiceFail() >= VOICE_FAIL_THRESHOLD
				|| counts.screenReentry() >= SCREEN_REENTRY_THRESHOLD;
			return initialConditionMet ? HelpStage.HIGHLIGHT : null;
		}

		LocalDateTime shownAt = lastShownAt(events, screenCode, previousStage);

		if (previousStage == HelpStage.HIGHLIGHT) {
			return longStayInactivityElapsed(events, screenCode, shownAt, now) ? HelpStage.VOICE : null;
		}

		// previousStage == VOICE
		boolean escalate =
			longStayInactivityElapsed(events, screenCode, shownAt, now)
			|| hasNewEventAfter(events, screenCode, EventType.INPUT_ERROR, shownAt)
			|| hasNewEventAfter(events, screenCode, EventType.VOICE_FAIL, shownAt);
		return escalate ? HelpStage.COUNSELOR : null;
	}

	/** 직전 단계 노출 후 20초 경과 && 그 이후 새로운 LONG_STAY 이벤트가 존재. */
	private boolean longStayInactivityElapsed(List<UserEvent> events, String screenCode,
			LocalDateTime shownAt, LocalDateTime now) {
		return Duration.between(shownAt, now).compareTo(ESCALATION_INACTIVITY) >= 0
			&& hasNewEventAfter(events, screenCode, EventType.LONG_STAY, shownAt);
	}

	private void recordShownStage(Long userId, String flowSessionId, FlowType flowType,
			String screenCode, HelpSignal signal, HelpStage stage, LocalDateTime now) {
		userEventRepository.save(UserEvent.builder()
			.userId(userId)
			.flowSessionId(flowSessionId)
			.flowType(flowType)
			.screenCode(screenCode)
			.eventType(EventType.HELP_SHOWN)
			.eventValue(signal == null ? null : signal.name())
			.helpStage(stage)
			.createdAt(now)
			.build());
	}

	private void recordSafetyCheckShownIfNeeded(Long userId, String flowSessionId, FlowType flowType,
			String screenCode, List<UserEvent> events, LocalDateTime riskAt, LocalDateTime now) {
		boolean alreadyShown = events.stream()
			.filter(e -> e.getEventType() == EventType.HELP_SHOWN)
			.filter(e -> e.getHelpStage() == HelpStage.SAFETY_CHECK)
			.anyMatch(e -> !e.getCreatedAt().isBefore(riskAt));
		if (!alreadyShown) {
			userEventRepository.save(UserEvent.builder()
				.userId(userId)
				.flowSessionId(flowSessionId)
				.flowType(flowType)
				.screenCode(screenCode)
				.eventType(EventType.HELP_SHOWN)
				.eventValue(HelpTriggerResponse.RISK_DETECTED)
				.helpStage(HelpStage.SAFETY_CHECK)
				.createdAt(now)
				.build());
		}
	}

	/**
	 * 위험 송금 실행 전, 해당 flowSession 에서 안심확인이 완료되었는지 검증한다.
	 * 같은 사용자 / 같은 flowSessionId / RISK_DETECTED 존재 / SAFETY_CHECK 노출 기록 /
	 * 위험 감지 이후 생성된 SAFETY_CONFIRMED 응답이 모두 있어야 true.
	 */
	public boolean isSafetyCheckCompleted(Long userId, String flowSessionId) {
		List<UserEvent> events = userEventRepository.findByFlowSessionIdOrderByCreatedAtAsc(flowSessionId).stream()
			.filter(e -> Objects.equals(e.getUserId(), userId))
			.toList();

		Optional<LocalDateTime> riskAt = events.stream()
			.filter(e -> e.getEventType() == EventType.RISK_DETECTED)
			.map(UserEvent::getCreatedAt)
			.max(Comparator.naturalOrder());
		if (riskAt.isEmpty()) {
			return false;
		}

		boolean safetyShown = events.stream()
			.filter(e -> e.getEventType() == EventType.HELP_SHOWN)
			.filter(e -> e.getHelpStage() == HelpStage.SAFETY_CHECK)
			.anyMatch(e -> !e.getCreatedAt().isBefore(riskAt.get()));

		boolean confirmedAfterRisk = events.stream()
			.filter(e -> e.getEventType() == EventType.HELP_RESPONSE)
			.filter(e -> e.getUserResponse() == HelpUserResponse.SAFETY_CONFIRMED)
			.anyMatch(e -> !e.getCreatedAt().isBefore(riskAt.get()));

		return safetyShown && confirmedAfterRisk;
	}

	/**
	 * 이상 송금 위험 감지를 기록한다. 위험 점검(riskCheck)에서 호출한다.
	 * 같은 flowSession 에 아직 해소되지 않은 RISK_DETECTED 가 있으면 중복 기록하지 않는다.
	 */
	@Transactional
	public void markRiskDetected(Long userId, String flowSessionId, FlowType flowType, String screenCode) {
		if (flowSessionId == null || flowSessionId.isBlank()) {
			return;
		}
		List<UserEvent> events = userEventRepository.findByFlowSessionIdOrderByCreatedAtAsc(flowSessionId);
		if (unresolvedRiskDetectedAt(events).isPresent()) {
			return;
		}
		userEventRepository.save(UserEvent.builder()
			.userId(userId)
			.flowSessionId(flowSessionId)
			.flowType(flowType)
			.screenCode(screenCode)
			.eventType(EventType.RISK_DETECTED)
			.createdAt(LocalDateTime.now(clock))
			.build());
	}

	/**
	 * 사용자가 안심확인 팝업에서 "확인했어요"를 눌렀을 때 호출한다.
	 * 해당 flowSession 에 위험 감지(RISK_DETECTED) 기록이 있어야만 SAFETY_CHECK 노출/확인 이벤트를
	 * 기록하고 true 를 반환한다. 위험 점검을 거치지 않은 세션이면 아무것도 하지 않고 false.
	 */
	@Transactional
	public boolean confirmSafetyCheck(Long userId, String flowSessionId, FlowType flowType, String screenCode) {
		if (flowSessionId == null || flowSessionId.isBlank()) {
			return false;
		}
		List<UserEvent> events = userEventRepository.findByFlowSessionIdOrderByCreatedAtAsc(flowSessionId).stream()
			.filter(e -> Objects.equals(e.getUserId(), userId))
			.toList();
		Optional<LocalDateTime> riskAt = events.stream()
			.filter(e -> e.getEventType() == EventType.RISK_DETECTED)
			.map(UserEvent::getCreatedAt)
			.max(Comparator.naturalOrder());
		if (riskAt.isEmpty()) {
			return false;
		}

		LocalDateTime now = LocalDateTime.now(clock);
		boolean alreadyShown = events.stream()
			.filter(e -> e.getEventType() == EventType.HELP_SHOWN)
			.filter(e -> e.getHelpStage() == HelpStage.SAFETY_CHECK)
			.anyMatch(e -> !e.getCreatedAt().isBefore(riskAt.get()));
		if (!alreadyShown) {
			userEventRepository.save(UserEvent.builder()
				.userId(userId)
				.flowSessionId(flowSessionId)
				.flowType(flowType)
				.screenCode(screenCode)
				.eventType(EventType.HELP_SHOWN)
				.eventValue(HelpTriggerResponse.RISK_DETECTED)
				.helpStage(HelpStage.SAFETY_CHECK)
				.createdAt(now)
				.build());
		}
		userEventRepository.save(UserEvent.builder()
			.userId(userId)
			.flowSessionId(flowSessionId)
			.flowType(flowType)
			.screenCode(screenCode)
			.eventType(EventType.HELP_RESPONSE)
			.helpStage(HelpStage.SAFETY_CHECK)
			.userResponse(HelpUserResponse.SAFETY_CONFIRMED)
			.createdAt(now.plusNanos(1_000))
			.build());
		return true;
	}

	/** 상담원 운영시간 사전 조회. 운영시간 내/외에 따라 프론트 버튼이 달라진다. */
	public AgentAvailabilityResponse agentAvailability() {
		LocalTime opens = LocalTime.parse(opensAt);
		LocalTime closes = LocalTime.parse(closesAt);
		ZonedDateTime now = ZonedDateTime.now(clock);

		boolean withinHours = !now.toLocalTime().isBefore(opens) && now.toLocalTime().isBefore(closes);
		boolean weekday = now.getDayOfWeek().getValue() <= 5;
		boolean available = withinHours && (!weekdaysOnly || weekday);

		LocalDateTime nextAvailableAt = available ? null : nextAvailable(now, opens);
		String operatingHoursText = (weekdaysOnly ? "평일 " : "매일 ") + opens + "~" + closes;
		String message = available
			? "지금 상담원과 연결할 수 있어요."
			: "지금은 상담 운영시간이 아니에요. " + operatingHoursText + " 사이에 연결할 수 있어요."
				+ " 급하시면 고객센터(" + supportPhone + ")로 전화해 주세요.";

		return new AgentAvailabilityResponse(available, opens, closes, weekdaysOnly,
			now.toLocalDateTime(), nextAvailableAt, supportPhone, operatingHoursText, message);
	}

	private LocalDateTime nextAvailable(ZonedDateTime now, LocalTime opens) {
		ZonedDateTime candidate = now.toLocalTime().isBefore(opens)
			? now.with(opens)
			: now.plusDays(1).with(opens);
		while (weekdaysOnly && candidate.getDayOfWeek().getValue() > 5) {
			candidate = candidate.plusDays(1).with(opens);
		}
		return candidate.toLocalDateTime();
	}

	// --- 집계 helper ---

	private HelpSignalCounts countsFor(List<UserEvent> events, String screenCode) {
		return new HelpSignalCounts(
			countOnScreen(events, screenCode, EventType.IRRELEVANT_CLICK),
			countOnScreen(events, screenCode, EventType.INPUT_ERROR),
			countOnScreen(events, screenCode, EventType.VOICE_FAIL),
			countOnScreen(events, screenCode, EventType.SCREEN_REENTRY));
	}

	private long countOnScreen(List<UserEvent> events, String screenCode, EventType type) {
		return events.stream()
			.filter(e -> e.getEventType() == type)
			.filter(e -> Objects.equals(e.getScreenCode(), screenCode))
			.count();
	}

	private boolean hasEventOnScreen(List<UserEvent> events, String screenCode, EventType type) {
		return events.stream()
			.anyMatch(e -> e.getEventType() == type && Objects.equals(e.getScreenCode(), screenCode));
	}

	private boolean hasNewEventAfter(List<UserEvent> events, String screenCode, EventType type, LocalDateTime after) {
		return events.stream()
			.filter(e -> e.getEventType() == type)
			.filter(e -> Objects.equals(e.getScreenCode(), screenCode))
			.anyMatch(e -> e.getCreatedAt().isAfter(after));
	}

	private HelpStage highestShownStage(List<UserEvent> events, String screenCode) {
		return events.stream()
			.filter(e -> e.getEventType() == EventType.HELP_SHOWN)
			.filter(e -> Objects.equals(e.getScreenCode(), screenCode))
			.map(UserEvent::getHelpStage)
			.filter(Objects::nonNull)
			.filter(HelpStage::isEscalation)
			.max(Comparator.comparingInt(Enum::ordinal))
			.orElse(null);
	}

	private LocalDateTime lastShownAt(List<UserEvent> events, String screenCode, HelpStage stage) {
		return events.stream()
			.filter(e -> e.getEventType() == EventType.HELP_SHOWN)
			.filter(e -> Objects.equals(e.getScreenCode(), screenCode))
			.filter(e -> e.getHelpStage() == stage)
			.map(UserEvent::getCreatedAt)
			.max(Comparator.naturalOrder())
			.orElse(LocalDateTime.MIN);
	}

	private Optional<LocalDateTime> lastRejectionAt(List<UserEvent> events, String screenCode) {
		return events.stream()
			.filter(e -> e.getEventType() == EventType.HELP_RESPONSE)
			.filter(e -> Objects.equals(e.getScreenCode(), screenCode))
			.filter(e -> e.getUserResponse() != null && e.getUserResponse().isRejection())
			.map(UserEvent::getCreatedAt)
			.max(Comparator.naturalOrder());
	}

	/** 세션에 미해소 RISK_DETECTED 가 있으면 가장 최근 감지 시각을 반환. */
	private Optional<LocalDateTime> unresolvedRiskDetectedAt(List<UserEvent> events) {
		Optional<LocalDateTime> lastRiskAt = events.stream()
			.filter(e -> e.getEventType() == EventType.RISK_DETECTED)
			.map(UserEvent::getCreatedAt)
			.max(Comparator.naturalOrder());
		if (lastRiskAt.isEmpty()) {
			return Optional.empty();
		}
		boolean resolved = events.stream()
			.filter(e -> e.getEventType() == EventType.HELP_RESPONSE)
			.filter(e -> e.getUserResponse() != null && e.getUserResponse().isSafetyResolution())
			.anyMatch(e -> !e.getCreatedAt().isBefore(lastRiskAt.get()));
		return resolved ? Optional.empty() : lastRiskAt;
	}

	private String messageFor(HelpStage stage, String screenCode) {
		if (stage == HelpStage.HIGHLIGHT) {
			return null;
		}
		String base = switch (screenCode == null ? "" : screenCode) {
			case "PASSWORD_INPUT" -> "비밀번호 여섯 자리를 천천히 눌러 주세요. 화면에 강조된 칸을 확인해 보세요.";
			case "ACCOUNT_NUMBER_INPUT" -> "받는 분 계좌번호를 숫자만 눌러 주세요. 강조된 입력칸을 확인해 보세요.";
			case "VOICE_LISTEN" -> "\"누구에게 얼마 보내줘\"처럼 한 번에 말씀해 보세요.";
			case "TRANSFER_CONFIRM" -> "보내는 금액과 받는 분을 확인하고 강조된 확인 버튼을 눌러 주세요.";
			default -> "화면에 강조된 버튼을 눌러 다음으로 진행해 보세요.";
		};
		if (stage == HelpStage.COUNSELOR) {
			return "계속 진행이 어려우시면 상담원이 도와드릴게요. " + base;
		}
		return base;
	}
}
