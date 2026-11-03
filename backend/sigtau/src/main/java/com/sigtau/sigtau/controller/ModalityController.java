package com.sigtau.sigtau.controller;
import com.sigtau.sigtau.dto.ApiResponse;
import com.sigtau.sigtau.dto.ModalityRequestDTO;
import com.sigtau.sigtau.dto.ModalityResponseDTO;
import com.sigtau.sigtau.service.ModalityService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/modalities")
public class ModalityController {
    private final ModalityService modalityService;
    public ModalityController(ModalityService modalityService) {
        this.modalityService = modalityService;
    }

    //Obtener Todos los registros
    @GetMapping
    public ResponseEntity<List<ModalityResponseDTO>> getAll() {
        List<ModalityResponseDTO> modalities = modalityService.listAll();
        return new ResponseEntity<>(modalities, HttpStatus.OK);
    }

    //Obtener por ID
    @GetMapping("/{id}")
    public ResponseEntity<ModalityResponseDTO> getById(@PathVariable Long id) {
        ModalityResponseDTO modality = modalityService.findById(id);
        return new ResponseEntity<>(modality, HttpStatus.OK);
    }

    //Crear
    @PostMapping
    public ResponseEntity<ApiResponse> save(@Valid @RequestBody ModalityRequestDTO dto) {
        modalityService.save(dto);
        return ResponseEntity.ok(new ApiResponse("Modalidad creada con exito"));
    }

    //Actualizar
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> update(@PathVariable Long id, @Valid @RequestBody ModalityRequestDTO dto) {
        modalityService.update(id, dto);
        return ResponseEntity.ok(new ApiResponse("Modalidad actualizada con exito"));
    }
    
    //Eliminar
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable Long id) {
        modalityService.delete(id);
        return ResponseEntity.ok(new ApiResponse("Modalidad eliminada con exito"));
    }
}
