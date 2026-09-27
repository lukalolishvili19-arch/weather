package com.weather.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueSerializer;
import tools.jackson.databind.cfg.CoercionAction;
import tools.jackson.databind.cfg.CoercionInputShape;
import tools.jackson.databind.module.SimpleModule;
import tools.jackson.databind.type.LogicalType;

/**
 * Request bodies were validated with zod, which never coerces: {@code "true"} is not a boolean and
 * {@code 42} is not a string. Jackson's lenient scalar coercion is switched off to match.
 * Doubles are written the way {@code JSON.stringify} writes numbers, so {@code 4.0} stays {@code 4}.
 */
@Configuration
public class JacksonConfig {

  @Bean
  JsonMapperBuilderCustomizer strictScalarCoercion() {
    SimpleModule numbers = new SimpleModule("js-numbers");
    numbers.addSerializer(Double.class, new JsNumberSerializer());
    numbers.addSerializer(Double.TYPE, new JsNumberSerializer());

    return builder -> builder
        .addModule(numbers)
        .disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
        .withCoercionConfig(LogicalType.Textual, config -> config
            .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
            .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
            .setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail))
        .withCoercionConfig(LogicalType.Boolean, config -> config
            .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
            .setCoercion(CoercionInputShape.String, CoercionAction.Fail))
        .withCoercionConfig(LogicalType.Integer, config -> config
            .setCoercion(CoercionInputShape.String, CoercionAction.Fail))
        .withCoercionConfig(LogicalType.Float, config -> config
            .setCoercion(CoercionInputShape.String, CoercionAction.Fail));
  }

  static final class JsNumberSerializer extends ValueSerializer<Double> {

    private static final double MAX_PLAIN_INTEGER = 1e21;

    @Override
    public void serialize(Double value, JsonGenerator generator, SerializationContext context) {
      double number = value;
      if (!Double.isFinite(number)) {
        generator.writeNull();
      } else if (number == Math.rint(number) && Math.abs(number) < MAX_PLAIN_INTEGER) {
        if (Math.abs(number) <= Long.MAX_VALUE) {
          generator.writeNumber((long) number);
        } else {
          generator.writeNumber(new java.math.BigDecimal(number).toBigInteger());
        }
      } else {
        generator.writeNumber(number);
      }
    }
  }
}
