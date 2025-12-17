package com.g174.mmssystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private List<NotificationItem> notifications;
    private Integer totalUnread;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationItem {
        private String id;
        private String type;
        private String icon; 
        private String title;
        private String message;
        private String link;
        private LocalDateTime timestamp;
        private Boolean isRead;
        private String priority;
    }
}
