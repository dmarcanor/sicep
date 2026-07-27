<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plantilla extends Model
{
    protected $fillable = [
        'nombre',
        'tipo',
        'contenido',
        'creado_por',
        'activa',
    ];

    protected $casts = [
        'activa' => 'boolean',
    ];

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }
}
