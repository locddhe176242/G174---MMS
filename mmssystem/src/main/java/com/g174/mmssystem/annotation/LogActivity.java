package com.g174.mmssystem.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogActivity {

    String action();
    String activityType();
    String description() default "";
    boolean includeClientInfo() default true;
    String entityId() default "";
}
