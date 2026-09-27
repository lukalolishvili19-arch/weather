package com.weather.config;

import jakarta.validation.constraints.Min;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Per-client-IP request budgets per minute; 0 disables a limit. */
@Validated
@ConfigurationProperties("app.rate-limit")
public record RateLimitProperties(
    @Min(0) int authPerMinute,
    @Min(0) int publicPerMinute) {
}
