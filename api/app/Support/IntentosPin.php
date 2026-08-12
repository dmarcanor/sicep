<?php

namespace App\Support;

use Illuminate\Support\Facades\RateLimiter;

/**
 * Cuenta los intentos fallidos de PIN de un usuario.
 *
 * Vive aquí y no en el middleware porque hay dos caminos para comprobar el
 * PIN: la cabecera X-PIN de cada acción y el endpoint /pin/verify que usa el
 * modal. Ambos comparten el mismo contador; si cada uno llevara el suyo, el
 * atacante dispondría del doble de intentos, y con sólo /pin/verify sin límite
 * bastaban 10.000 pruebas para adivinar un PIN de cuatro dígitos.
 */
class IntentosPin
{
    public const MAXIMO = 5;
    public const VENTANA_SEGUNDOS = 60;

    private static function llave(int $usuarioId): string
    {
        return 'pin:' . $usuarioId;
    }

    public static function bloqueado(int $usuarioId): bool
    {
        return RateLimiter::tooManyAttempts(self::llave($usuarioId), self::MAXIMO);
    }

    public static function segundosRestantes(int $usuarioId): int
    {
        return RateLimiter::availableIn(self::llave($usuarioId));
    }

    public static function registrarFallo(int $usuarioId): void
    {
        RateLimiter::hit(self::llave($usuarioId), self::VENTANA_SEGUNDOS);
    }

    public static function limpiar(int $usuarioId): void
    {
        RateLimiter::clear(self::llave($usuarioId));
    }
}
