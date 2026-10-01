package com.ares3dstudio.backend.controller;

import com.ares3dstudio.backend.model.InventoryItem;
import com.ares3dstudio.backend.repository.InventoryItemRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryItemRepository inventoryRepository;

    public InventoryController(InventoryItemRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @GetMapping
    public List<InventoryItem> getInventory() {
        return inventoryRepository.findAll().stream()
                .sorted((first, second) -> {
                    int categoryOrder = first.getCategory().compareToIgnoreCase(second.getCategory());
                    return categoryOrder != 0 ? categoryOrder : first.getName().compareToIgnoreCase(second.getName());
                })
                .toList();
    }

    @PostMapping
    public ResponseEntity<InventoryItem> createInventoryItem(@Valid @RequestBody InventoryItem item) {
        item.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryRepository.save(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItem> updateInventoryItem(
            @PathVariable Long id,
            @Valid @RequestBody InventoryItem updatedItem) {
        return inventoryRepository.findById(id)
                .map(existing -> {
                    existing.setName(updatedItem.getName());
                    existing.setCategory(updatedItem.getCategory());
                    existing.setColor(updatedItem.getColor());
                    existing.setQuantity(updatedItem.getQuantity());
                    existing.setUnit(updatedItem.getUnit());
                    return ResponseEntity.ok(inventoryRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInventoryItem(@PathVariable Long id) {
        if (!inventoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        inventoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}