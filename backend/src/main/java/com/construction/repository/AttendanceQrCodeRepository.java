package com.construction.repository;

import com.construction.model.AttendanceQrCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceQrCodeRepository extends JpaRepository<AttendanceQrCode, Long> {

    Optional<AttendanceQrCode> findFirstByDateAndActiveTrueOrderByCreatedAtDesc(LocalDate date);

    Optional<AttendanceQrCode> findByCodeToken(String codeToken);

    List<AttendanceQrCode> findByDateAndActiveTrue(LocalDate date);

    List<AttendanceQrCode> findByDateOrderByCreatedAtDesc(LocalDate date);

    @Modifying
    @Transactional
    @Query("UPDATE AttendanceQrCode q SET q.active = false WHERE q.date = :date")
    void deactivateAllForDate(@Param("date") LocalDate date);
}
