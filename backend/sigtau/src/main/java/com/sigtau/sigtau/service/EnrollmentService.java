package com.sigtau.sigtau.service;

import com.sigtau.sigtau.dto.CancelEnrollmentDTO;
import com.sigtau.sigtau.dto.EnrollmentResponseDTO;
import com.sigtau.sigtau.entity.*;
import com.sigtau.sigtau.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Reglas de inscripción (reciclado de la lógica de stock de Entry/Exit, ahora transaccional y con bloqueo). */
@Service
@Transactional
public class EnrollmentService {
    private final EnrollmentRepository enrollmentRepository;
    private final TutoringRepository tutoringRepository;
    private final ReasonRepository reasonRepository;
    private final CurrentUserService currentUser;
    private final UserRepository userRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository, TutoringRepository tutoringRepository,
                             ReasonRepository reasonRepository, CurrentUserService currentUser, UserRepository userRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.tutoringRepository = tutoringRepository;
        this.reasonRepository = reasonRepository;
        this.currentUser = currentUser;
        this.userRepository = userRepository;
    }

    private EnrollmentResponseDTO toDTO(Enrollment e) {
        EnrollmentResponseDTO d = new EnrollmentResponseDTO();
        Tutoring t = e.getTutoring();
        d.setId(e.getId());
        d.setTutoringId(t.getId());
        d.setTutoringTitle(t.getTitle());
        d.setSubjectName(t.getSubject().getName());
        d.setTutoringDate(t.getTutoringDate());
        d.setStartTime(t.getStartTime());
        d.setEndTime(t.getEndTime());
        d.setTutorName(t.getTutor().getName());
        d.setStudentId(e.getStudent().getId());
        d.setStudentName(e.getStudent().getName());
        d.setStudentEmail(e.getStudent().getEmail());
        d.setStatus(e.getStatus().name());
        d.setEnrolledAt(e.getEnrolledAt());
        d.setCanceledAt(e.getCanceledAt());
        if (e.getReason() != null) d.setReasonName(e.getReason().getName());
        return d;
    }

    private boolean overlaps(Tutoring a, Tutoring b) {
        return a.getTutoringDate().equals(b.getTutoringDate())
                && a.getStartTime().isBefore(b.getEndTime())
                && b.getStartTime().isBefore(a.getEndTime());
    }

    /** El estudiante sale del JWT, no del cuerpo de la petición. */
    public EnrollmentResponseDTO enroll(Long tutoringId) {
        User student = userRepository.findByIdForUpdate(currentUser.get().getId())
                .orElseThrow(() -> new AccessDeniedException("Usuario no encontrado"));
        // Bloqueo de la fila: dos inscripciones simultáneas no pueden tomar el mismo último cupo
        Tutoring t = tutoringRepository.findByIdForUpdate(tutoringId)
                .orElseThrow(() -> new RuntimeException("Tutoría no encontrada"));

        if (t.getStatus() != TutoringStatus.OPEN) {
            throw new IllegalArgumentException("La tutoría no está abierta para inscripciones");
        }
        if (!t.getTutoringDate().atTime(t.getStartTime()).isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("La tutoría ya comenzó o finalizó");
        }
        if (t.getAvailableSpots() <= 0) {
            throw new IllegalArgumentException("No hay cupos disponibles");
        }
        if (enrollmentRepository.existsByStudentIdAndTutoringIdAndStatus(student.getId(), tutoringId, EnrollmentStatus.ACTIVE)) {
            throw new IllegalArgumentException("Ya estás inscrito en esta tutoría");
        }
        for (Enrollment other : enrollmentRepository.findByStudentIdAndStatus(student.getId(), EnrollmentStatus.ACTIVE)) {
            if (overlaps(t, other.getTutoring())) {
                throw new IllegalArgumentException("Tienes otra tutoría en ese mismo horario");
            }
        }

        Enrollment e = new Enrollment();
        e.setStudent(student);
        e.setTutoring(t);
        e.setEnrolledAt(LocalDateTime.now());
        e.setStatus(EnrollmentStatus.ACTIVE);
        t.setAvailableSpots(t.getAvailableSpots() - 1);
        tutoringRepository.save(t);
        return toDTO(enrollmentRepository.save(e));
    }

    public EnrollmentResponseDTO cancel(Long enrollmentId, CancelEnrollmentDTO dto) {
        Enrollment e = enrollmentRepository.findByIdForUpdate(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Inscripción no encontrada"));
        User me = currentUser.get();
        boolean isAdmin = currentUser.hasRole("ADMIN");
        if (!isAdmin && !e.getStudent().getId().equals(me.getId())) {
            throw new AccessDeniedException("No puedes cancelar la inscripción de otro estudiante");
        }
        if (e.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new IllegalArgumentException("La inscripción ya fue cancelada");
        }
        Tutoring t = tutoringRepository.findByIdForUpdate(e.getTutoring().getId())
                .orElseThrow(() -> new RuntimeException("Tutoría no encontrada"));
        if (!isAdmin && !t.getTutoringDate().atTime(t.getStartTime()).isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("No se puede cancelar una tutoría que ya comenzó");
        }
        if (dto != null && dto.getReasonId() != null) {
            e.setReason(reasonRepository.findById(dto.getReasonId())
                    .orElseThrow(() -> new RuntimeException("Motivo no encontrado")));
        }
        e.setStatus(EnrollmentStatus.CANCELED);
        e.setCanceledAt(LocalDateTime.now());
        t.setAvailableSpots(Math.min(t.getCapacity(), t.getAvailableSpots() + 1));
        tutoringRepository.save(t);
        return toDTO(enrollmentRepository.save(e));
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponseDTO> listMine() {
        return enrollmentRepository.findByStudentIdOrderByEnrolledAtDesc(currentUser.get().getId())
                .stream().map(this::toDTO).toList();
    }

    /** ADMIN ve todas; TUTOR solo las de sus tutorías. Filtro opcional por tutoría. */
    @Transactional(readOnly = true)
    public List<EnrollmentResponseDTO> listAll(Long tutoringId) {
        List<Enrollment> list;
        if (currentUser.hasRole("ADMIN")) {
            list = tutoringId != null
                    ? enrollmentRepository.findByTutoringIdOrderByEnrolledAtDesc(tutoringId)
                    : enrollmentRepository.findAllByOrderByEnrolledAtDesc();
        } else {
            list = enrollmentRepository.findByTutoringTutorIdOrderByEnrolledAtDesc(currentUser.get().getId());
            if (tutoringId != null) {
                list = list.stream().filter(e -> e.getTutoring().getId().equals(tutoringId)).toList();
            }
        }
        return list.stream().map(this::toDTO).toList();
    }
}
