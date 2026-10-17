<?php

namespace App\Support;

use App\Models\Expediente;
use App\Models\Nna;
use App\Models\Representante;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Convierte los valores de clave foránea del historial en nombres legibles.
 * Se aplica al leer, así que también corrige las filas ya guardadas con IDs.
 *
 * Si se añade una clave foránea nueva, hay que añadirla aquí: la prueba
 * ReglasDeAccesoTest verifica que todas las del esquema estén cubiertas.
 */
class ValoresHistorial
{
    public const CAMPOS = [
        'asignado_a' => User::class,
        'asignado_por' => User::class,
        'creado_por' => User::class,
        'registrado_por' => User::class,
        'solicitante_id' => User::class,
        'usuario_id' => User::class,
        'expediente_id' => Expediente::class,
        'nna_id' => Nna::class,
        'representante_id' => Representante::class,
    ];

    /** @param Collection<int, \App\Models\HistorialCambio> $cambios */
    public static function resolver(Collection $cambios): void
    {
        $ids = [];

        foreach ($cambios as $cambio) {
            if (!array_key_exists($cambio->campo, self::CAMPOS)) {
                continue;
            }

            foreach ([$cambio->valor_anterior, $cambio->valor_nuevo] as $valor) {
                if (self::esId($valor)) {
                    $ids[$cambio->campo][] = (int) $valor;
                }
            }
        }

        $nombres = [];

        foreach ($ids as $campo => $lista) {
            $modelo = self::CAMPOS[$campo];

            foreach ($modelo::query()->whereIn('id', array_unique($lista))->get() as $registro) {
                $nombres[$campo][$registro->id] = self::etiqueta($registro);
            }
        }

        foreach ($cambios as $cambio) {
            if (!array_key_exists($cambio->campo, self::CAMPOS)) {
                continue;
            }

            $anterior = self::valor($cambio->campo, $cambio->valor_anterior, $nombres);
            $nuevo = self::valor($cambio->campo, $cambio->valor_nuevo, $nombres);

            $cambio->setAttribute('valor_anterior', $anterior);
            $cambio->setAttribute('valor_nuevo', $nuevo);
        }
    }

    private static function valor(string $campo, ?string $valor, array $nombres): ?string
    {
        if (!self::esId($valor)) {
            return $valor;
        }

        $id = (int) $valor;

        return $nombres[$campo][$id] ?? "Eliminado (ID {$id})";
    }

    private static function esId(?string $valor): bool
    {
        return $valor !== null && ctype_digit($valor);
    }

    private static function etiqueta($registro): string
    {
        return match (true) {
            $registro instanceof User => $registro->display_name ?: ($registro->name ?: $registro->username),
            $registro instanceof Expediente => $registro->codigo,
            default => trim("{$registro->nombres} {$registro->apellidos}"),
        };
    }
}
