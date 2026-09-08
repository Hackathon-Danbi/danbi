package com.danbi.help;

import static org.assertj.core.api.Assertions.assertThat;

import com.danbi.domain.help.dto.BehaviorEventRequest;
import com.danbi.domain.help.dto.HelpTriggerResponse;
import com.danbi.domain.help.entity.EventType;
import com.danbi.domain.help.entity.FlowType;
import com.danbi.domain.help.entity.HelpSignal;
import com.danbi.domain.help.entity.HelpStage;
import com.danbi.domain.help.entity.HelpUserResponse;
import com.danbi.domain.help.repository.UserEventRepository;
import com.danbi.domain.help.service.HelpService;
import com.danbi.support.MutableClock;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class HelpServiceTest {

	private static final String SCREEN = "ACCOUNT_NUMBER_INPUT";

	@TestConfiguration
	static class ClockOverride {
		@Bean
		@Primary
		MutableClock testClock() {
			return MutableClock.atSeoul(LocalDateTime.of(2026, 9, 7, 10, 0, 0));
		}
	}

	@Autowired
	private HelpService helpService;
	@Autowired
	private UserEventRepository userEventRepository;
	@Autowired
	private MutableClock clock;

	private String session;

	@BeforeEach
	void setUp() {
		clock.setTo(LocalDateTime.of(2026, 9, 7, 10, 0, 0));
		session = "flow-" + System.nanoTime();
	}

	private HelpTriggerResponse trigger(HelpSignal signal) {
		return helpService.trigger(1L, session, FlowType.REAL_TRANSFER, SCREEN, signal);
	}

	private void record(EventType type) {
		helpService.recordEvent(new BehaviorEventRequest(
			1L, session, FlowType.REAL_TRANSFER, SCREEN, type, null, null, null, null, null));
	}

	private void recordResponse(HelpStage stage, HelpUserResponse response) {
		helpService.recordEvent(new BehaviorEventRequest(
			1L, session, FlowType.REAL_TRANSFER, SCREEN, EventType.HELP_RESPONSE, null, null, null, stage, response));
	}

	/** HIGHLIGHT → VOICE 로 올리고 VOICE 의 shownAt 을 반환. */
	private void escalateToVoice() {
		record(EventType.LONG_STAY);
		assertThat(trigger(HelpSignal.LONG_STAY).helpStage()).isEqualTo(HelpStage.HIGHLIGHT);
		clock.advanceSeconds(20);
		record(EventType.LONG_STAY);
		assertThat(trigger(HelpSignal.LONG_STAY).helpStage()).isEqualTo(HelpStage.VOICE);
	}

	@Test
	void initialConditionMet_showsHighlight() {
		record(EventType.LONG_STAY);

		HelpTriggerResponse res = trigger(HelpSignal.LONG_STAY);

		assertThat(res.show()).isTrue();
		assertThat(res.helpStage()).isEqualTo(HelpStage.HIGHLIGHT);
		assertThat(res.previousStage()).isNull();
	}

	@Test
	void repeatedTriggerAlone_doesNotEscalateToVoice() {
		record(EventType.LONG_STAY);
		assertThat(trigger(HelpSignal.LONG_STAY).helpStage()).isEqualTo(HelpStage.HIGHLIGHT);

		HelpTriggerResponse again = trigger(HelpSignal.LONG_STAY);

		assertThat(again.show()).isFalse();
		assertThat(again.reason()).isEqualTo(HelpTriggerResponse.THRESHOLD_NOT_MET);
		assertThat(again.previousStage()).isEqualTo(HelpStage.HIGHLIGHT);
	}

	@Test
	void accumulatedInputErrorsAlone_doNotEscalateAfterHighlight() {
		record(EventType.INPUT_ERROR);
		record(EventType.INPUT_ERROR);
		assertThat(trigger(HelpSignal.INPUT_ERROR).helpStage()).isEqualTo(HelpStage.HIGHLIGHT);

		clock.advanceSeconds(30); // 시간이 지나도 새 LONG_STAY 가 없으면 상승 금지

		HelpTriggerResponse again = trigger(HelpSignal.INPUT_ERROR);
		assertThat(again.show()).isFalse();
		assertThat(again.previousStage()).isEqualTo(HelpStage.HIGHLIGHT);
	}

	@Test
	void highlightThenTwentySecondsAndNewLongStay_escalatesToVoice() {
		record(EventType.LONG_STAY);
		assertThat(trigger(HelpSignal.LONG_STAY).helpStage()).isEqualTo(HelpStage.HIGHLIGHT);

		clock.advanceSeconds(20);
		record(EventType.LONG_STAY);

		HelpTriggerResponse res = trigger(HelpSignal.LONG_STAY);
		assertThat(res.show()).isTrue();
		assertThat(res.helpStage()).isEqualTo(HelpStage.VOICE);
		assertThat(res.previousStage()).isEqualTo(HelpStage.HIGHLIGHT);
	}

	@Test
	void voiceThenNewInputError_escalatesToCounselor() {
		escalateToVoice();

		clock.advanceSeconds(3);
		record(EventType.INPUT_ERROR);

		HelpTriggerResponse res = trigger(HelpSignal.INPUT_ERROR);
		assertThat(res.show()).isTrue();
		assertThat(res.helpStage()).isEqualTo(HelpStage.COUNSELOR);
		assertThat(res.counselor()).isTrue();
	}

	@Test
	void afterCounselor_furtherTriggerReturnsShowFalse() {
		escalateToVoice();
		clock.advanceSeconds(3);
		record(EventType.INPUT_ERROR);
		assertThat(trigger(HelpSignal.INPUT_ERROR).helpStage()).isEqualTo(HelpStage.COUNSELOR);

		HelpTriggerResponse res = trigger(HelpSignal.LONG_STAY);

		assertThat(res.show()).isFalse();
		assertThat(res.reason()).isEqualTo(HelpTriggerResponse.FINAL_STAGE_ALREADY_SHOWN);
		assertThat(res.previousStage()).isEqualTo(HelpStage.COUNSELOR);
		// COUNSELOR 이후 HELP_SHOWN 이 더 쌓이지 않음
		assertThat(userEventRepository.findByFlowSessionIdOrderByCreatedAtAsc(session).stream()
			.filter(e -> e.getEventType() == EventType.HELP_SHOWN && e.getHelpStage() == HelpStage.COUNSELOR)
			.count()).isEqualTo(1);
	}

	@Test
	void unresolvedRiskDetected_takesPrecedenceOverGeneralHelp() {
		record(EventType.INPUT_ERROR);
		record(EventType.INPUT_ERROR); // 일반 도움 기준 충족 상태
		record(EventType.RISK_DETECTED);

		HelpTriggerResponse res = trigger(HelpSignal.INPUT_ERROR);

		assertThat(res.show()).isTrue();
		assertThat(res.helpStage()).isEqualTo(HelpStage.SAFETY_CHECK);
		assertThat(res.reason()).isEqualTo(HelpTriggerResponse.RISK_DETECTED);
	}

	@Test
	void rejectionSuppressesGeneralHelpFor30s_butNewErrorOverrides() {
		escalateToVoice(); // VOICE 노출, shownAt = 10:00:20
		recordResponse(HelpStage.VOICE, HelpUserResponse.CLOSE_HELP); // 거절

		clock.advanceSeconds(5);
		record(EventType.LONG_STAY);
		HelpTriggerResponse suppressed = trigger(HelpSignal.LONG_STAY);
		assertThat(suppressed.show()).isFalse();
		assertThat(suppressed.reason()).isEqualTo(HelpTriggerResponse.SUPPRESSED_AFTER_REJECT);

		record(EventType.INPUT_ERROR); // 거절 이후 새 오류 → 억제 예외 + VOICE→COUNSELOR 조건 충족
		HelpTriggerResponse overridden = trigger(HelpSignal.INPUT_ERROR);
		assertThat(overridden.show()).isTrue();
		assertThat(overridden.helpStage()).isEqualTo(HelpStage.COUNSELOR);
	}

	@Test
	void agentAvailability_usesSeoulTimeAndReturnsSupportInfo() {
		clock.setTo(LocalDateTime.of(2026, 9, 7, 22, 0, 0)); // 월요일 22시 → 운영시간 종료 후

		var res = helpService.agentAvailability();

		assertThat(res.available()).isFalse();
		assertThat(res.supportPhoneNumber()).isEqualTo("1588-0000");
		assertThat(res.operatingHoursText()).isEqualTo("평일 09:00~18:00");
		assertThat(res.nextAvailableAt()).isEqualTo(LocalDateTime.of(2026, 9, 8, 9, 0, 0)); // 다음 영업일 09:00
		assertThat(res.now()).isEqualTo(LocalDateTime.of(2026, 9, 7, 22, 0, 0));
	}
}
