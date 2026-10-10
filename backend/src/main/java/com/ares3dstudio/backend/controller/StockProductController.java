package com.ares3dstudio.backend.controller;

import com.ares3dstudio.backend.model.StockProduct;
import com.ares3dstudio.backend.repository.StockProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stock-products")
public class StockProductController {
    private final StockProductRepository repository;
    public StockProductController(StockProductRepository repository) { this.repository = repository; }

    @GetMapping
    public List<StockProduct> getAll() {
        return repository.findAll().stream()
                .sorted((a, b) -> b.getProductDate().compareTo(a.getProductDate())).toList();
    }

    @PostMapping
    public ResponseEntity<StockProduct> create(@Valid @RequestBody StockProduct product) {
        product.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockProduct> update(@PathVariable Long id, @Valid @RequestBody StockProduct updated) {
        return repository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setDescription(updated.getDescription());
            existing.setImageData(updated.getImageData());
            existing.setPrice(updated.getPrice());
            existing.setProductDate(updated.getProductDate());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
