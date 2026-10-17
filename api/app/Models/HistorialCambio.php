<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistorialCambio extends Model
{
    protected $table = 'historial_cambios';

    public const UPDATED_AT = null;

    protected $fillable = [
        'historial_id',
        'campo',
        'valor_anterior',
        'valor_nuevo',
    ];

    public function historial(): BelongsTo
    {
        return $this->belongsTo(Historial::class, 'historial_id');
    }
}
