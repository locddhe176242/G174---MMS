package com.g174.mmssystem.scheduler;

import com.g174.mmssystem.entity.RFQ;
import com.g174.mmssystem.repository.RFQRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RFQScheduler {

    private final RFQRepository rfqRepository;

    /**
     * Tự động đóng RFQ quá hạn phản hồi
     * Chạy mỗi ngày lúc 00:01 (1 phút sau nửa đêm)
     */
    @Scheduled(cron = "0 1 0 * * ?")
    @Transactional
    public void autoCloseOverdueRFQs() {
        log.info("Starting auto-close overdue RFQs task...");
        
        try {
            LocalDate today = LocalDate.now();
            
            // Tìm tất cả RFQ quá hạn
            List<RFQ> overdueRFQs = rfqRepository.findOverdueRFQs(today);
            
            if (overdueRFQs.isEmpty()) {
                log.info("No overdue RFQs found.");
                return;
            }
            
            // Đóng tất cả RFQ quá hạn
            for (RFQ rfq : overdueRFQs) {
                rfq.setStatus(RFQ.RFQStatus.Closed);
                rfq.setNotes(rfq.getNotes() != null 
                    ? rfq.getNotes() + "\n[Tự động đóng vào " + today + " - Quá hạn phản hồi]"
                    : "[Tự động đóng vào " + today + " - Quá hạn phản hồi]");
                rfqRepository.save(rfq);
                
                log.info("Auto-closed overdue RFQ: {} (Due date: {})", 
                    rfq.getRfqNo(), rfq.getDueDate());
            }
            
            log.info("Successfully auto-closed {} overdue RFQ(s)", overdueRFQs.size());
            
        } catch (Exception e) {
            log.error("Error while auto-closing overdue RFQs: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Kiểm tra RFQ sắp hết hạn (còn 2 ngày)
     * Chạy mỗi ngày lúc 09:00 sáng
     */
    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional(readOnly = true)
    public void checkExpiringRFQs() {
        log.info("Checking RFQs expiring soon...");
        
        try {
            LocalDate today = LocalDate.now();
            LocalDate twoDaysLater = today.plusDays(2);
            
            // Tìm RFQ sắp hết hạn trong 2 ngày tới
            List<RFQ> expiringRFQs = rfqRepository.findExpiringRFQs(today, twoDaysLater);
            
            if (!expiringRFQs.isEmpty()) {
                log.warn("Warning: {} RFQ(s) expiring within 2 days!", expiringRFQs.size());
                expiringRFQs.forEach(rfq -> 
                    log.warn("RFQ {} will expire on {}", rfq.getRfqNo(), rfq.getDueDate())
                );
            } else {
                log.info("No RFQs expiring soon.");
            }
            
        } catch (Exception e) {
            log.error("Error while checking expiring RFQs: {}", e.getMessage(), e);
        }
    }
}
