package com.weather.dto.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/** Accepts what the Node API's {@code z.string().url()} accepted: any string parseable as an absolute URL. */
@Documented
@Constraint(validatedBy = AbsoluteUrlValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT, ElementType.TYPE_USE})
@Retention(RetentionPolicy.RUNTIME)
public @interface AbsoluteUrl {

  String message() default "Invalid url";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
