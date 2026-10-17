<?php

namespace App\Support;

use App\Models\Historial;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Registra quién hizo qué, cuándo y desde dónde, y el detalle campo por campo
 * de lo que cambió. Toda escritura del sistema pasa por aquí.
 */
class Auditoria
{
    private const EXCLUIDOS = ['password', 'pin', 'remember_token'];

    private const SIN_CAMBIOS = ['id', 'created_at', 'updated_at'];

    /**
     * Asigna los datos, calcula qué cambia y guarda. Hay que usarlo en lugar de
     * update(), porque después de guardar Eloquent ya no conserva los valores
     * anteriores.
     *
     * @return array<string, array{0: ?string, 1: ?string}>
     */
    public static function actualizar(Model $modelo, array $datos): array
    {
        $modelo->fill($datos);
        $cambios = self::diferencias($modelo);
        $modelo->save();

        return $cambios;
    }

    /** @return array<string, array{0: ?string, 1: ?string}> */
    public static function diferencias(Model $modelo): array
    {
        $cambios = [];

        foreach ($modelo->getDirty() as $campo => $nuevo) {
            if (self::excluido($campo)) {
                continue;
            }

            self::aplanar($cambios, $campo, $modelo->getOriginal($campo), $nuevo);
        }

        return $cambios;
    }

    /** Valores iniciales de un registro recién creado. */
    public static function creacion(Model $modelo): array
    {
        return self::instantanea($modelo, antes: false);
    }

    /** Valores que tenía un registro justo antes de eliminarlo. */
    public static function eliminacion(Model $modelo): array
    {
        return self::instantanea($modelo, antes: true);
    }

    public static function registrar(
        Request $request,
        string $accion,
        string $modulo,
        ?string $detalles = null,
        ?Model $registro = null,
        array $cambios = [],
        string $estado = 'Exitoso',
        ?int $usuarioId = null,
    ): Historial {
        return DB::transaction(function () use ($request, $accion, $modulo, $detalles, $registro, $cambios, $estado, $usuarioId) {
            $historial = Historial::create([
                'usuario_id' => $usuarioId ?? $request->user()->id,
                'accion' => $accion,
                'modulo' => $modulo,
                'registro_tipo' => $registro ? class_basename($registro) : null,
                'registro_id' => $registro?->getKey(),
                'detalles' => $detalles,
                'estado' => $estado,
                'ip_address' => $request->ip(),
            ]);

            foreach ($cambios as $campo => [$antes, $despues]) {
                $historial->cambios()->create([
                    'campo' => $campo,
                    'valor_anterior' => $antes,
                    'valor_nuevo' => $despues,
                ]);
            }

            return $historial;
        });
    }

    private static function instantanea(Model $modelo, bool $antes): array
    {
        $cambios = [];

        foreach ($modelo->getAttributes() as $campo => $valor) {
            if (self::excluido($campo) || in_array($campo, self::SIN_CAMBIOS, true) || $valor === null) {
                continue;
            }

            if ($antes) {
                self::aplanar($cambios, $campo, $valor, null);
            } else {
                self::aplanar($cambios, $campo, null, $valor);
            }
        }

        return $cambios;
    }

    private static function aplanar(array &$cambios, string $campo, mixed $antes, mixed $despues): void
    {
        if (is_array($antes) || is_array($despues)) {
            $antes = is_array($antes) ? $antes : [];
            $despues = is_array($despues) ? $despues : [];

            foreach (array_unique([...array_keys($antes), ...array_keys($despues)]) as $clave) {
                self::aplanar($cambios, "{$campo}.{$clave}", $antes[$clave] ?? null, $despues[$clave] ?? null);
            }

            return;
        }

        $textoAntes = self::texto($antes);
        $textoDespues = self::texto($despues);

        if ($textoAntes === $textoDespues) {
            return;
        }

        $cambios[$campo] = [$textoAntes, $textoDespues];
    }

    private static function texto(mixed $valor): ?string
    {
        if ($valor === null) {
            return null;
        }

        if (is_bool($valor)) {
            return $valor ? 'Sí' : 'No';
        }

        if ($valor instanceof DateTimeInterface) {
            return $valor->format('Y-m-d H:i:s');
        }

        return (string) $valor;
    }

    private static function excluido(string $campo): bool
    {
        return in_array(explode('.', $campo)[0], self::EXCLUIDOS, true);
    }
}
