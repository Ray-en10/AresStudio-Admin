package com.ares3dstudio.backend.repository;

import com.ares3dstudio.backend.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
}