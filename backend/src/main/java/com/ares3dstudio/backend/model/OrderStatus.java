package com.ares3dstudio.backend.model;

public enum OrderStatus {
    PENDING,        // en cours
    READY,          // prête à récupérer
    PICKED_UP,      // récupérée
    COMPLETED       // livrée / terminée
}
