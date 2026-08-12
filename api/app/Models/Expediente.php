<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Expediente extends Model
{
    protected $fillable = [
        'nna_id',
        'representante_id',
        'codigo',
        'fecha',
        'hora_registro',
        'sector',
        'estatus',
        'estatus_fisico',
        'cerrado_en',
        'prioridad',
        'tipificacion',
        'causa',
        'observaciones',
        'resumen_pdf_ruta',
        'resumen_pdf_nombre',
        'registrado_por',
    ];

    protected $casts = [
        'fecha' => 'date:Y-m-d',
        'cerrado_en' => 'datetime',
    ];

    protected $appends = [
        'nna_nombre',
        'representante_nombre',
    ];

    public function getNnaNombreAttribute(): ?string
    {
        return $this->nna
            ? trim("{$this->nna->nombres} {$this->nna->apellidos}")
            : null;
    }

    public function getRepresentanteNombreAttribute(): ?string
    {
        return $this->representante
            ? trim("{$this->representante->nombres} {$this->representante->apellidos}")
            : null;
    }

    public function nna(): BelongsTo
    {
        return $this->belongsTo(Nna::class);
    }

    public function representante(): BelongsTo
    {
        return $this->belongsTo(Representante::class);
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function bitacoras(): HasMany
    {
        return $this->hasMany(Bitacora::class);
    }

    public function casos(): HasMany
    {
        return $this->hasMany(Caso::class);
    }

    public function solicitudesArchivo(): HasMany
    {
        return $this->hasMany(SolicitudArchivo::class);
    }
}
