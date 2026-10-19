package com.construction.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_qr_code")
@JsonIgnoreProperties(ignoreUnknown = true)
public class AttendanceQrCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "QR Code token is required")
    @Column(nullable = false, unique = true, length = 120)
    private String codeToken;

    @NotNull(message = "Date is required")
    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @NotNull(message = "Expiry time is required")
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean active = true;

    @Column(length = 100)
    private String createdBy;

    @Column(nullable = false)
    private int totalScans = 0;

    public AttendanceQrCode() {
    }

    public AttendanceQrCode(String codeToken, LocalDate date, LocalDateTime createdAt, LocalDateTime expiresAt, boolean active, String createdBy) {
        this.codeToken = codeToken;
        this.date = date;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.active = active;
        this.createdBy = createdBy;
        this.totalScans = 0;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodeToken() {
        return codeToken;
    }

    public void setCodeToken(String codeToken) {
        this.codeToken = codeToken;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public int getTotalScans() {
        return totalScans;
    }

    public void setTotalScans(int totalScans) {
        this.totalScans = totalScans;
    }

    public void incrementScans() {
        this.totalScans++;
    }
}
