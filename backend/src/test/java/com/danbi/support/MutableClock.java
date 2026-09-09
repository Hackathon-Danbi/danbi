package com.danbi.support;

import com.danbi.config.ClockConfig;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/** 테스트에서 시간을 임의로 전진시킬 수 있는 Clock. 기본 존은 Asia/Seoul. */
public class MutableClock extends Clock {

	private Instant instant;
	private final ZoneId zone;

	public MutableClock(Instant instant, ZoneId zone) {
		this.instant = instant;
		this.zone = zone;
	}

	public static MutableClock atSeoul(LocalDateTime start) {
		return new MutableClock(start.atZone(ClockConfig.KST).toInstant(), ClockConfig.KST);
	}

	@Override
	public ZoneId getZone() {
		return zone;
	}

	@Override
	public Clock withZone(ZoneId newZone) {
		return new MutableClock(instant, newZone);
	}

	@Override
	public Instant instant() {
		return instant;
	}

	public void advanceSeconds(long seconds) {
		instant = instant.plusSeconds(seconds);
	}

	public void setTo(LocalDateTime dateTime) {
		instant = dateTime.atZone(zone).toInstant();
	}
}
