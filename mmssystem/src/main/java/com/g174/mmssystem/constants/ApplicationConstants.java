package com.g174.mmssystem.constants;


public final class ApplicationConstants {

    private ApplicationConstants() {
        throw new AssertionError("Utility class cannot be instantiated");
    }

    public static final String JWT_SECRET_KEY = "JWT_SECRET";

    public static final String JWT_SECRET_DEFAULT_VALUE =
            "mmsSecretKeyJWT2024!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";

    public static final String JWT_HEADER = "Authorization";
    public static final String JWT_TOKEN_PREFIX = "Bearer ";

    public static final long JWT_ACCESS_TOKEN_VALIDITY = 24 * 60 * 60 * 1000;      // 24 hours
    public static final long JWT_REFRESH_TOKEN_VALIDITY = 7 * 24 * 60 * 60 * 1000; // 7 days

    public static final String USER_STATUS_ACTIVE = "Active";
    public static final String USER_STATUS_INACTIVE = "Inactive";

    public static final String ROLE_PREFIX = "ROLE_";
    public static final String ANONYMOUS_USER = "anonymousUser";
}