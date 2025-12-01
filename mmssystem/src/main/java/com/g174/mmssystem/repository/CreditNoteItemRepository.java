package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.CreditNoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreditNoteItemRepository extends JpaRepository<CreditNoteItem, Integer> {

    List<CreditNoteItem> findByCreditNote_CnId(Integer creditNoteId);

    void deleteByCreditNote_CnId(Integer creditNoteId);
}

