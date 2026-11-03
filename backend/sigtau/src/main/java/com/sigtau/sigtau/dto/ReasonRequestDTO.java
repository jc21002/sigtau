package com.sigtau.sigtau.dto;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReasonRequestDTO {

    @NotBlank(message = "El nombre es requerido")
    @Size(max = 100)
    private String name;

    @Size(max = 255)
    private String description;

}
