package com.g174.mmssystem.dto.requestDTO;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class FlexibleOffsetDateTimeDeserializer extends JsonDeserializer<OffsetDateTime> {
    
    private static final DateTimeFormatter[] FORMATTERS = {
        DateTimeFormatter.ISO_OFFSET_DATE_TIME,  // "2025-12-11T17:44:22.539Z"
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss[.SSS][XXX]"),  // Flexible with optional timezone
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),  // Without timezone
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")  // With milliseconds but no timezone
    };

    @Override
    public OffsetDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String dateString = p.getText().trim();
        
        if (dateString == null || dateString.isEmpty()) {
            return null;
        }

        // Try parsing with OffsetDateTime formatters first
        for (DateTimeFormatter formatter : FORMATTERS) {
            try {
                if (dateString.contains("Z") || dateString.contains("+") || dateString.contains("-") && 
                    (dateString.lastIndexOf('-') > 10 || dateString.contains("+"))) {
                    // Has timezone indicator
                    return OffsetDateTime.parse(dateString, formatter);
                }
            } catch (DateTimeParseException e) {
                // Continue to next formatter
            }
        }

        // If no timezone found, parse as LocalDateTime and convert to OffsetDateTime with system default
        try {
            LocalDateTime localDateTime = LocalDateTime.parse(dateString, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss[.SSS]"));
            return localDateTime.atOffset(ZoneOffset.UTC);
        } catch (DateTimeParseException e) {
            throw new IOException("Unable to parse date-time: " + dateString, e);
        }
    }
}

