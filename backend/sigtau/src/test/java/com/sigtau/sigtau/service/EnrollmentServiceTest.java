package com.sigtau.sigtau.service;

import com.sigtau.sigtau.entity.*;
import com.sigtau.sigtau.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock EnrollmentRepository enrollmentRepository;
    @Mock TutoringRepository tutoringRepository;
    @Mock ReasonRepository reasonRepository;
    @Mock CurrentUserService currentUser;
    @Mock UserRepository userRepository;
    @InjectMocks EnrollmentService service;

    @BeforeEach
    void studentLock() {
        org.mockito.Mockito.lenient().when(userRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(user(1L, "Ana")));
    }

    private User user(Long id, String name) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        u.setEmail(name.toLowerCase() + "@mail.com");
        return u;
    }

    private Tutoring tutoring(Long id, int spots) {
        Career career = new Career();
        career.setName("Ingeniería");
        Subject subject = new Subject();
        subject.setName("Cálculo");
        subject.setCareer(career);
        Tutoring t = new Tutoring();
        t.setId(id);
        t.setTitle("Repaso");
        t.setTutoringDate(LocalDate.now().plusDays(3));
        t.setStartTime(LocalTime.of(10, 0));
        t.setEndTime(LocalTime.of(12, 0));
        t.setCapacity(5);
        t.setAvailableSpots(spots);
        t.setStatus(TutoringStatus.OPEN);
        t.setSubject(subject);
        t.setTutor(user(99L, "Tutor"));
        return t;
    }

    @Test
    void enroll_descuentaUnCupo() {
        Tutoring t = tutoring(10L, 2);
        when(currentUser.get()).thenReturn(user(1L, "Ana"));
        when(tutoringRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(t));
        when(enrollmentRepository.existsByStudentIdAndTutoringIdAndStatus(1L, 10L, EnrollmentStatus.ACTIVE)).thenReturn(false);
        when(enrollmentRepository.findByStudentIdAndStatus(1L, EnrollmentStatus.ACTIVE)).thenReturn(List.of());
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        service.enroll(10L);

        assertEquals(1, t.getAvailableSpots());
    }

    @Test
    void enroll_sinCupos_falla() {
        when(currentUser.get()).thenReturn(user(1L, "Ana"));
        when(tutoringRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(tutoring(10L, 0)));

        assertThrows(IllegalArgumentException.class, () -> service.enroll(10L));
    }

    @Test
    void enroll_yaInscrito_falla() {
        when(currentUser.get()).thenReturn(user(1L, "Ana"));
        when(tutoringRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(tutoring(10L, 3)));
        when(enrollmentRepository.existsByStudentIdAndTutoringIdAndStatus(1L, 10L, EnrollmentStatus.ACTIVE)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.enroll(10L));
    }

    @Test
    void cancel_deOtroEstudiante_denegado() {
        Enrollment e = new Enrollment();
        e.setId(5L);
        e.setStudent(user(2L, "Luis"));
        e.setTutoring(tutoring(10L, 1));
        when(enrollmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(e));
        when(currentUser.get()).thenReturn(user(1L, "Ana"));
        when(currentUser.hasRole("ADMIN")).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> service.cancel(5L, null));
    }

    @Test
    void cancel_devuelveElCupo() {
        Tutoring t = tutoring(10L, 1);
        Enrollment e = new Enrollment();
        e.setId(5L);
        e.setStudent(user(1L, "Ana"));
        e.setTutoring(t);
        e.setStatus(EnrollmentStatus.ACTIVE);
        when(enrollmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(e));
        when(currentUser.get()).thenReturn(user(1L, "Ana"));
        when(currentUser.hasRole("ADMIN")).thenReturn(false);
        when(tutoringRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(t));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        service.cancel(5L, null);

        assertEquals(2, t.getAvailableSpots());
        assertEquals(EnrollmentStatus.CANCELED, e.getStatus());
    }

    @Test
    void enroll_horarioTraslapado_fallaSinCambiarCupos() {
        Tutoring t = tutoring(10L, 3);
        Enrollment other = new Enrollment();
        other.setTutoring(tutoring(11L, 2));
        when(currentUser.get()).thenReturn(user(1L, "Ana"));
        when(tutoringRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(t));
        when(enrollmentRepository.findByStudentIdAndStatus(1L, EnrollmentStatus.ACTIVE)).thenReturn(List.of(other));
        assertThrows(IllegalArgumentException.class, () -> service.enroll(10L));
        assertEquals(3, t.getAvailableSpots());
    }

    @Test
    void enroll_tutoriaCerrada_falla() {
        Tutoring t = tutoring(10L, 3);
        t.setStatus(TutoringStatus.CLOSED);
        when(currentUser.get()).thenReturn(user(1L, "Ana"));
        when(tutoringRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(t));
        assertThrows(IllegalArgumentException.class, () -> service.enroll(10L));
    }

    @Test
    void enroll_tutoriaPasada_falla() {
        Tutoring t = tutoring(10L, 3);
        t.setTutoringDate(LocalDate.now().minusDays(1));
        when(currentUser.get()).thenReturn(user(1L, "Ana"));
        when(tutoringRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(t));
        assertThrows(IllegalArgumentException.class, () -> service.enroll(10L));
    }

    @Test
    void cancel_segundaCancelacion_noDevuelveOtroCupo() {
        Tutoring t = tutoring(10L, 2);
        Enrollment e = new Enrollment();
        e.setStudent(user(1L, "Ana"));
        e.setTutoring(t);
        e.setStatus(EnrollmentStatus.CANCELED);
        when(enrollmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(e));
        when(currentUser.get()).thenReturn(user(1L, "Ana"));
        assertThrows(IllegalArgumentException.class, () -> service.cancel(5L, null));
        assertEquals(2, t.getAvailableSpots());
    }
}
