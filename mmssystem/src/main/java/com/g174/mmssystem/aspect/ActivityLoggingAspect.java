package com.g174.mmssystem.aspect;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.service.IService.IActivityLogService;
import com.g174.mmssystem.service.IService.IUserContextService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

@Aspect
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class ActivityLoggingAspect {

    private final IActivityLogService activityLogService;
    private final IUserContextService userContextService;
    private final ExpressionParser parser = new SpelExpressionParser();

    @Around("@annotation(logActivity)")
    public Object logActivity(ProceedingJoinPoint joinPoint, LogActivity logActivity) throws Throwable {

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        Object result = joinPoint.proceed();

        Integer userId = userContextService.getCurrentUserId();
        if (userId == null) {
            userId = resolveUserIdFromResult(result);
        }
        if (userId == null) {
            log.warn("Skip activity logging: cannot resolve userId for method {}", method.getName());
            return result;
        }

        try {
            String action = logActivity.action();
            String activityType = logActivity.activityType();
            String description = evaluateDescription(logActivity.description(), joinPoint, result);
            String entityId = evaluateEntityId(logActivity.entityId(), joinPoint, result);

            if (logActivity.includeClientInfo()) {
                HttpServletRequest request = getCurrentRequest();
                String ipAddress = getClientIpAddress(request);
                String deviceInfo = getClientUserAgent(request);

                if (entityId != null && !entityId.isEmpty()) {
                    activityLogService.logEntityActivity(
                            userId, action, activityType, Integer.parseInt(entityId), description, ipAddress
                    );
                } else {
                    activityLogService.logUserActivity(
                            userId, action, activityType, description, ipAddress, deviceInfo
                    );
                }
            } else {
                if (entityId != null && !entityId.isEmpty()) {
                    activityLogService.logEntityActivity(
                            userId, action, activityType, Integer.parseInt(entityId), description
                    );
                } else {
                    activityLogService.logUserActivity(userId, action, activityType, description);
                }
            }

            log.debug("Activity logged: User {} - {} - {}", userId, action, activityType);

        } catch (Exception e) {
            log.warn("Failed to log activity for method {}: {}", method.getName(), e.getMessage());
        }

        return result;
    }


    private String evaluateDescription(String description, ProceedingJoinPoint joinPoint, Object result) {
        if (description == null || description.isEmpty()) {
            return "Activity performed";
        }

        try {
            EvaluationContext context = new StandardEvaluationContext();

            Object[] args = joinPoint.getArgs();
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] paramNames = signature.getParameterNames();

            for (int i = 0; i < args.length; i++) {
                context.setVariable(paramNames[i], args[i]);
            }

            context.setVariable("result", result);

            Expression expression = parser.parseExpression(description);
            return expression.getValue(context, String.class);

        } catch (Exception e) {
            log.warn("Error evaluating description expression: {}", e.getMessage());
            return description;
        }
    }

    private String evaluateEntityId(String entityId, ProceedingJoinPoint joinPoint, Object result) {
        if (entityId == null || entityId.isEmpty()) {
            return null;
        }

        try {
            EvaluationContext context = new StandardEvaluationContext();

            Object[] args = joinPoint.getArgs();
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] paramNames = signature.getParameterNames();

            for (int i = 0; i < args.length; i++) {
                context.setVariable(paramNames[i], args[i]);
            }

            context.setVariable("result", result);

            Expression expression = parser.parseExpression(entityId);
            Object value = expression.getValue(context);
            return value != null ? value.toString() : null;

        } catch (Exception e) {
            log.warn("Error evaluating entityId expression: {}", e.getMessage());
            return null;
        }
    }

    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            log.warn("Error getting current request: {}", e.getMessage());
            return null;
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) return null;

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private String getClientUserAgent(HttpServletRequest request) {
        if (request == null) return null;
        return request.getHeader("User-Agent");
    }

    private Integer resolveUserIdFromResult(Object result) {
        if (result == null) return null;
        try {
            if (result instanceof org.springframework.http.ResponseEntity<?> responseEntity) {
                Object body = responseEntity.getBody();
                Integer id = resolveUserIdFromResult(body);
                if (id != null) return id;
            }
            try {
                Object user = result.getClass().getMethod("getUser").invoke(result);
                if (user != null) {
                    Object idObj = user.getClass().getMethod("getId").invoke(user);
                    if (idObj instanceof Integer) return (Integer) idObj;
                    if (idObj != null) return Integer.valueOf(idObj.toString());
                }
            } catch (NoSuchMethodException ignored) { }
            try {
                Object idObj = result.getClass().getMethod("getUserId").invoke(result);
                if (idObj instanceof Integer) return (Integer) idObj;
                if (idObj != null) return Integer.valueOf(idObj.toString());
            } catch (NoSuchMethodException ignored) { }
            try {
                Object data = result.getClass().getMethod("getData").invoke(result);
                if (data instanceof java.util.Map<?, ?> map) {
                    Object idObj = map.get("userId");
                    if (idObj instanceof Integer) return (Integer) idObj;
                    if (idObj != null) return Integer.valueOf(idObj.toString());
                }
            } catch (NoSuchMethodException ignored) { }
        } catch (Exception e) {
            log.debug("resolveUserIdFromResult failed: {}", e.getMessage());
        }
        return null;
    }
}