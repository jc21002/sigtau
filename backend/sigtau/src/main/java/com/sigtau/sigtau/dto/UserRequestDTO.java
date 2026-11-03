package com.sigtau.sigtau.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRequestDTO {
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Formato de email invalido")
    private String email;

    @NotBlank(message = "El telefono es obligatorio")
    @Size(max = 20)
    private String phone;

    /** Obligatoria al crear; en edición, si viene vacía se conserva la actual. */
    @Pattern(regexp = "(?s)^(?:|.{6,64})$", message = "La contraseña debe tener entre 6 y 64 caracteres")
    private String password;

    @NotNull(message = "El rol es obligatorio")
    private Long roleId;
}
