<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudArchivo extends Model
{
    // La convención de Eloquent daría solicitud_archivos; la tabla es solicitudes_archivo.
    protected $table = 'solicitudes_archivo';

    protected $fillable = [
        'codigo',
        'expediente_id',
        'solicitante_id',
        'documentos_solicitados',
        'estatus',
        'observaciones',
        'fecha_entrega',
        'solicitante_nombre',
        'cargo',
        'caso',
        'motivo',
        'fecha_solicitud',
        'fecha_prestamo',
        'fecha_devolucion',
        'ubicacion_archivo',
        'ubicacion_estante',
        'ubicacion_nivel',
        'ubicacion_caja',
    ];

    protected $casts = [
        'fecha_entrega' => 'datetime',
        // Fechas del expediente físico: sin hora, para que <input type="date">
        // pueda consumirlas tal cual.
        'fecha_solicitud' => 'date:Y-m-d',
        'fecha_prestamo' => 'date:Y-m-d',
        'fecha_devolucion' => 'date:Y-m-d',
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
