<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PasswordAlfanumerica implements ValidationRule
{
    public function __construct(private ?string $usuario = null)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!preg_match('/[A-Za-z]/', $value) || !preg_match('/[0-9]/', $value)) {
            $fail('La contraseña debe combinar letras y números.');

            return;
        }

        if ($this->usuario && stripos($value, $this->usuario) !== false) {
            $fail('La contraseña no puede contener el nombre de usuario.');
        }
    }
}
