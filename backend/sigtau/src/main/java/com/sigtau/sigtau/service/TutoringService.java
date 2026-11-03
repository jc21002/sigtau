package com.sigtau.sigtau.service;

import com.sigtau.sigtau.dto.TutoringRequestDTO;
import com.sigtau.sigtau.dto.TutoringResponseDTO;
import com.sigtau.sigtau.entity.*;
import com.sigtau.sigtau.repository.*;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class TutoringService {
    private final TutoringRepository tutoringRepository;
    private final SubjectRepository subjectRepository;
    private final ModalityRepository modalityRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CurrentUserService currentUser;

    public TutoringService(TutoringRepository tutoringRepository, SubjectRepository subjectRepository,
                           ModalityRepository modalityRepository, UserRepository userRepository,
                           EnrollmentRepository enrollmentRepository, CurrentUserService currentUser) {
        this.tutoringRepository = tutoringRepository;
        this.subjectRepository = subjectRepository;
        this.modalityRepository = modalityRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.currentUser = currentUser;
    }

    private TutoringResponseDTO toDTO(Tutoring t, Set<Long> myTutoringIds) {
        TutoringResponseDTO d = new TutoringResponseDTO();
        d.setId(t.getId());
        d.setTitle(t.getTitle());
        d.setDescription(t.getDescription());
        d.setTutoringDate(t.getTutoringDate());
        d.setStartTime(t.getStartTime());
        d.setEndTime(t.getEndTime());
        d.setLocation(t.getLocation());
        d.setCapacity(t.getCapacity());
        d.setAvailableSpots(t.getAvailableSpots());
        d.setStatus(t.getStatus().name());
        d.setSubjectId(t.getSubject().getId());
        d.setSubjectName(t.getSubject().getName());
        d.setCareerName(t.getSubject().getCareer().getName());
        d.setModalityId(t.getModality().getId());
        d.setModalityName(t.getModality().getName());
        d.setTutorId(t.getTutor().getId());
        d.setTutorName(t.getTutor().getName());
        d.setEnrolledByMe(myTutoringIds.contains(t.getId()));
        return d;
    }

    /** Ids de tutorías en las que el usuario actual (si es estudiante) tiene inscripción activa. */
    private Set<Long> myActiveTutoringIds() {
        Set<Long> ids = new HashSet<>();
        if (currentUser.hasRole("STUDENT")) {
            Long me = currentUser.get().getId();
            enrollmentRepository.findByStudentIdAndStatus(me, EnrollmentStatus.ACTIVE)
                    .forEach(e -> ids.add(e.getTutoring().getId()));
        }
        return ids;
    }

    private void checkOwner(Tutoring t) {
        if (currentUser.hasRole("TUTOR") && !t.getTutor().getId().equals(currentUser.get().getId())) {
            throw new AccessDeniedException("Solo puedes modificar tus propias tutorías");
        }
    }

    private User resolveTutor(Long tutorId) {
        if (currentUser.hasRole("TUTOR")) return currentUser.get();
        if (tutorId == null) throw new IllegalArgumentException("Debe indicar el tutor");
        User tutor = userRepository.findById(tutorId).orElseThrow(() -> new RuntimeException("Tutor no encontrado"));
        if (!"TUTOR".equals(tutor.getRole().getName())) {
            throw new IllegalArgumentException("El usuario seleccionado no es tutor");
        }
        return tutor;
    }

    private void apply(Tutoring t, TutoringRequestDTO dto) {
        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalArgumentException("La hora de fin debe ser posterior a la de inicio");
        }
        t.setTitle(dto.getTitle());
        t.setDescription(dto.getDescription());
        t.setTutoringDate(dto.getTutoringDate());
        t.setStartTime(dto.getStartTime());
        t.setEndTime(dto.getEndTime());
        t.setLocation(dto.getLocation());
        t.setCapacity(dto.getCapacity());
        t.setSubject(subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Materia no encontrada")));
        t.setModality(modalityRepository.findById(dto.getModalityId())
                .orElseThrow(() -> new RuntimeException("Modalidad no encontrada")));
        if (dto.getStatus() != null) t.setStatus(dto.getStatus());
    }

    @Transactional(readOnly = true)
    public List<TutoringResponseDTO> listAll() {
        Set<Long> mine = myActiveTutoringIds();
        return tutoringRepository.findAll(Sort.by("tutoringDate", "startTime")).stream()
                .map(t -> toDTO(t, mine)).toList();
    }

    /** Tutorías del tutor autenticado (el ADMIN ve todas). */
    @Transactional(readOnly = true)
    public List<TutoringResponseDTO> listMine() {
        List<Tutoring> list = currentUser.hasRole("ADMIN")
                ? tutoringRepository.findAll(Sort.by("tutoringDate", "startTime"))
                : tutoringRepository.findByTutorId(currentUser.get().getId());
        return list.stream().map(t -> toDTO(t, Set.of())).toList();
    }

    @Transactional(readOnly = true)
    public TutoringResponseDTO findById(Long id) {
        Tutoring t = tutoringRepository.findById(id).orElseThrow(() -> new RuntimeException("Tutoría no encontrada"));
        return toDTO(t, myActiveTutoringIds());
    }

    public TutoringResponseDTO save(TutoringRequestDTO dto) {
        if (!dto.getTutoringDate().atTime(dto.getStartTime()).isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("La tutoría debe comenzar en el futuro");
        }
        Tutoring t = new Tutoring();
        apply(t, dto);
        t.setTutor(resolveTutor(dto.getTutorId()));
        t.setAvailableSpots(dto.getCapacity());
        if (t.getStatus() == null) t.setStatus(TutoringStatus.OPEN);
        return toDTO(tutoringRepository.save(t), Set.of());
    }

    public TutoringResponseDTO update(Long id, TutoringRequestDTO dto) {
        Tutoring t = tutoringRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new RuntimeException("Tutoría no encontrada"));
        checkOwner(t);
        long active = enrollmentRepository.countByTutoringIdAndStatus(id, EnrollmentStatus.ACTIVE);
        if (dto.getCapacity() < active) {
            throw new IllegalArgumentException("La capacidad no puede ser menor a los inscritos actuales (" + active + ")");
        }
        boolean scheduleChanged = !t.getTutoringDate().equals(dto.getTutoringDate())
                || !t.getStartTime().equals(dto.getStartTime()) || !t.getEndTime().equals(dto.getEndTime());
        if (scheduleChanged && active > 0) {
            throw new IllegalArgumentException("No se puede cambiar el horario con estudiantes inscritos; cancele las inscripciones primero");
        }
        if (scheduleChanged && !dto.getTutoringDate().atTime(dto.getStartTime()).isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("El nuevo horario debe comenzar en el futuro");
        }
        apply(t, dto);
        t.setAvailableSpots(dto.getCapacity() - (int) active);
        if (currentUser.hasRole("ADMIN") && dto.getTutorId() != null) {
            t.setTutor(resolveTutor(dto.getTutorId()));
        }
        return toDTO(tutoringRepository.save(t), Set.of());
    }

    public void delete(Long id) {
        Tutoring t = tutoringRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new RuntimeException("Tutoría no encontrada"));
        checkOwner(t);
        if (enrollmentRepository.countByTutoringIdAndStatus(id, EnrollmentStatus.ACTIVE) > 0) {
            throw new IllegalArgumentException("Tiene estudiantes inscritos: ciérrela en lugar de eliminarla");
        }
        enrollmentRepository.deleteByTutoringId(id);
        tutoringRepository.delete(t);
    }
}
