<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use LogicException;

class Historial extends Model
{
    protected $table = 'historial';

    protected $fillable = [
        'usuario_id',
        'accion',
        'modulo',
        'registro_tipo',
        'registro_id',
        'detalles',
        'estado',
        'ip_address',
    ];

    /**
     * El historial sólo se añade. Se bloquea aquí y no sólo en las rutas, para
     * que ningún código pueda reescribir una entrada por accidente.
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new LogicException('El historial no puede modificarse.');
        });

        static::deleting(function () {
            throw new LogicException('El historial no puede eliminarse.');
        });
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function cambios(): HasMany
    {
        return $this->hasMany(HistorialCambio::class, 'historial_id')->orderBy('id');
    }
}
