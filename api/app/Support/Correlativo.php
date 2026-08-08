<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Correlativo
{
    /**
     * Crea un registro asignándole el siguiente código de la serie.
     *
     * El número sale del mayor correlativo ya emitido, no de max(id): los id
     * saltan y se reutilizan, lo que hacía que la numeración retrocediera
     * respecto a los expedientes existentes. El bloqueo dentro de la
     * transacción evita que dos altas simultáneas reciban el mismo código.
     */
    public static function crear(string $modelo, string $prefijo, array $atributos): Model
    {
        return DB::transaction(function () use ($modelo, $prefijo, $atributos) {
            $inicio = strlen($prefijo) + 1;

            $ultimo = $modelo::query()
                ->where('codigo', 'like', $prefijo . '%')
                ->lockForUpdate()
                ->selectRaw("COALESCE(MAX(CAST(SUBSTRING(codigo, {$inicio}) AS UNSIGNED)), 0) AS maximo")
                ->value('maximo');

            $atributos['codigo'] = $prefijo . str_pad((int) $ultimo + 1, 6, '0', STR_PAD_LEFT);

            return $modelo::create($atributos);
        });
    }
}
