package com.danbi.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		// 프론트(src/api/client.ts)가 credentials: 'include' 로 요청하므로 allowCredentials 를 켠다.
		// allowedOriginPatterns 는 와일드카드여도 실제 Origin 을 그대로 반영해 돌려준다.
		registry.addMapping("/api/**")
			.allowedOriginPatterns("*")
			.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
			.allowedHeaders("*")
			.allowCredentials(true);
	}
}
