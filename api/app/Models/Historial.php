<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
