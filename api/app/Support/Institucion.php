<?php

namespace App\Support;

use App\Models\Configuracion;

class Institucion
{
    /**
     * Ajustes que cualquier usuario autenticado necesita para pintar la
     * aplicación: datos de la institución, membrete de los documentos y los
     * umbrales de las alertas de lapso.
     *
     * Van por su propio endpoint porque /configuracion exige el módulo
     * `configuracion`, que por defecto sólo tiene el administrador: un
     * consejero que emite una citación también necesita el membrete.
     */
    public const CATEGORIAS = ['general', 'membrete', 'contacto', 'sistema'];

    public static function valores(): array
    {
        return Configuracion::query()
            ->whereIn('categoria', self::CATEGORIAS)
            ->pluck('valor', 'clave')
            ->toArray();
    }
}
