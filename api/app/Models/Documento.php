<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Documento extends Model
{
    protected $fillable = [
        'expediente_id',
        'creado_por',
        'plantilla',
        'titulo',
        'datos',
        'estado',
        'emitido_en',
    ];

    protected $casts = [
        'datos' => 'array',
        'emitido_en' => 'datetime',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class);
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }
}
