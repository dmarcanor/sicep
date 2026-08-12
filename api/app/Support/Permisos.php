<?php

namespace App\Support;

use App\Models\Configuracion;

class Permisos
{
    /**
     * Los módulos del sistema. La matriz de Configuración → Permisos por rol
     * ofrece esta misma lista a todos los roles configurables: lo que cambia
     * entre ellos son los valores de partida, no lo que se les puede conceder.
     */
    public const MODULOS = [
        'principal',
        'urd',
        'nna',
        'representantes',
        'expedientes',
        'solicitudArchivos',
        'asignacionCasos',
        'plantillas',
        'reportes',
        'historial',
        'usuarios',
        'configuracion',
    ];

    /**
     * El panel principal es la pantalla de aterrizaje tras iniciar sesión: se
     * concede siempre para que ninguna combinación de la matriz deje a un rol
     * sin ninguna pantalla a la que entrar.
     */
    public const MODULO_BASE = 'principal';

    /**
     * El administrador no aparece en la matriz: su definición es tener acceso a
     * todo. Hacerlo configurable permitiría además que se quitara a sí mismo
     * Configuración y se quedara sin forma de volver a entrar.
     */
    public const ROL_TOTAL = 'administrador';

    public const ROLES_CONFIGURABLES = ['supervisor', 'consejero'];

    /**
     * Punto de partida de cada rol. Son sólo los valores por defecto: desde
     * Configuración se le puede conceder a cualquier rol cualquier módulo.
     */
    public const PREDETERMINADOS = [
        'supervisor' => [
            'principal', 'urd', 'nna', 'representantes', 'expedientes',
            'solicitudArchivos', 'asignacionCasos', 'reportes', 'historial',
        ],
        'consejero' => [
            'principal', 'urd', 'nna', 'representantes', 'expedientes', 'solicitudArchivos',
        ],
    ];

    public static function clave(string $rol): string
    {
        return "permisos_{$rol}";
    }

    /**
     * Módulos efectivos de un rol. Si lo guardado no es utilizable se cae a los
     * predeterminados, nunca a una lista vacía.
     */
    public static function delRol(?string $rol): array
    {
        if ($rol === self::ROL_TOTAL) {
            return self::MODULOS;
        }

        if (!in_array($rol, self::ROLES_CONFIGURABLES, true)) {
            return [];
        }

        $guardado = json_decode((string) Configuracion::obtener(self::clave($rol)), true);

        $lista = is_array($guardado)
            ? $guardado
            : self::PREDETERMINADOS[$rol];

        $lista[] = self::MODULO_BASE;

        // Se reordena según MODULOS para que el menú salga siempre igual, y de
        // paso se descarta cualquier identificador que ya no exista.
        return array_values(array_intersect(self::MODULOS, array_unique($lista)));
    }

    public static function permite(?string $rol, string $modulo): bool
    {
        return in_array($modulo, self::delRol($rol), true);
    }
}
