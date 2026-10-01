package com.ares3dstudio.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Embeddable
public class OrderLine {

    @NotBlank
    @Column(name = "model_url", nullable = false, length = 2048)
    private String modelUrl;

    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer quantity;

    public OrderLine() {
    }

    public String getModelUrl() {
        return modelUrl;
    }

    public void setModelUrl(String modelUrl) {
        this.modelUrl = modelUrl;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}