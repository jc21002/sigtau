package com.sigtau.sigtau.service;
import com.sigtau.sigtau.dto.TutoringRequestDTO;
import com.sigtau.sigtau.entity.*;
import com.sigtau.sigtau.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TutoringServiceTest {
 @Mock TutoringRepository tutoringRepository;
 @Mock SubjectRepository subjectRepository;
 @Mock ModalityRepository modalityRepository;
 @Mock UserRepository userRepository;
 @Mock EnrollmentRepository enrollmentRepository;
 @Mock CurrentUserService currentUser;
 @InjectMocks TutoringService service;
 TutoringRequestDTO request(LocalDate date) {
  TutoringRequestDTO d=new TutoringRequestDTO();
  d.setTutoringDate(date); d.setStartTime(LocalTime.of(10,0)); d.setEndTime(LocalTime.of(11,0)); d.setCapacity(5);
  return d;
 }
 Tutoring existing() {
  Tutoring t=new Tutoring(); t.setTutoringDate(LocalDate.now().plusDays(1));
  t.setStartTime(LocalTime.of(10,0));t.setEndTime(LocalTime.of(11,0));return t;
 }
 @Test void rejectsPastCreation() {
  assertThrows(IllegalArgumentException.class,()->service.save(request(LocalDate.now().minusDays(1))));
  verifyNoInteractions(tutoringRepository);
 }
 @Test void rejectsRescheduleWithEnrolledStudents() {
  when(tutoringRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(existing()));
  when(enrollmentRepository.countByTutoringIdAndStatus(1L,EnrollmentStatus.ACTIVE)).thenReturn(1L);
  assertThrows(IllegalArgumentException.class,()->service.update(1L,request(LocalDate.now().plusDays(2))));
  verify(tutoringRepository,never()).save(any());
 }
 @Test void rejectsRescheduleIntoPast() {
  when(tutoringRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(existing()));
  assertThrows(IllegalArgumentException.class,()->service.update(1L,request(LocalDate.now().minusDays(1))));
  verify(tutoringRepository,never()).save(any());
 }
}
