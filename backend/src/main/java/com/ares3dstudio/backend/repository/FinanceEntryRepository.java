package com.ares3dstudio.backend.repository;

import com.ares3dstudio.backend.model.FinanceEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinanceEntryRepository extends JpaRepository<FinanceEntry, Long> {}
