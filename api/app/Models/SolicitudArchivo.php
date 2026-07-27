<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudArchivo extends Model
{
    protected $fillable = [
        'codigo',
        'expediente_id',
        'solicitante_id',
        'documentos_solicitados',
        'estatus',
        'observaciones',
        'fecha_entrega',
    ];

    protected $casts = [
        'fecha_entrega' => 'datetime',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class);
    }

    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'solicitante_id');
    }
}
