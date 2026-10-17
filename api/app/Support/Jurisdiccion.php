<?php

namespace App\Support;

use App\Models\Documento;
use App\Models\Expediente;
use App\Models\User;

/**
 * Quién puede tocar qué. El supervisor (secretaría) observa y da formato, pero
 * no modifica el contenido de un expediente: esa tarea corresponde al consejero
 * asignado al caso y al administrador.
 */
class Jurisdiccion
{
    public const ROL_TOTAL = 'administrador';
    public const ROL_SUPERVISOR = 'supervisor';

    public static function esAdministrador(User $usuario): bool
    {
        return $usuario->role === self::ROL_TOTAL;
    }

    public static function esConsejeroDelCaso(User $usuario, Expediente $expediente): bool
    {
        return $expediente->casos()->where('asignado_a', $usuario->id)->exists();
    }

    public static function puedeEditarExpediente(User $usuario, Expediente $expediente): bool
    {
        return self::esAdministrador($usuario) || self::esConsejeroDelCaso($usuario, $expediente);
    }

    /**
     * La secretaría lleva la carpeta física y el PDF resumen, pero no el
     * contenido del expediente.
     */
    public static function puedeGestionarArchivoFisico(User $usuario, Expediente $expediente): bool
    {
        return self::puedeEditarExpediente($usuario, $expediente) || self::esSupervisor($usuario);
    }

    public static function esSupervisor(User $usuario): bool
    {
        return $usuario->role === self::ROL_SUPERVISOR;
    }

    public static function puedeRegistrarActuacion(User $usuario, Expediente $expediente): bool
    {
        return self::puedeEditarExpediente($usuario, $expediente);
    }

    public static function puedeObservar(User $usuario): bool
    {
        return in_array($usuario->role, [self::ROL_TOTAL, self::ROL_SUPERVISOR], true);
    }

    public static function puedeReasignarCasos(User $usuario): bool
    {
        return self::puedeObservar($usuario);
    }

    /**
     * Un documento lo modifica quien lo redactó, el administrador, o el
     * consejero asignado al expediente al que pertenece.
     */
    public static function puedeModificarDocumento(User $usuario, Documento $documento): bool
    {
        if (self::esAdministrador($usuario) || $documento->creado_por === $usuario->id) {
            return true;
        }

        $expediente = $documento->expediente;

        return $expediente !== null && self::esConsejeroDelCaso($usuario, $expediente);
    }

    public static function puedeDescartarDocumento(User $usuario, Documento $documento): bool
    {
        return self::esAdministrador($usuario) || $documento->creado_por === $usuario->id;
    }
}
