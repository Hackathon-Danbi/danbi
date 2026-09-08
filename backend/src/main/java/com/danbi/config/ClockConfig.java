package com.danbi.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {

	/** 배포 서버가 UTC여도 한국 운영시간이 정확히 계산되도록 KST 고정. */
	public static final ZoneId KST = ZoneId.of("Asia/Seoul");

	@Bean
	public Clock clock() {
		return Clock.system(KST);
	}
}
