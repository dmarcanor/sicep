<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bitacora extends Model
{
    protected $table = 'bitacoras';

    protected $fillable = [
        'expediente_id',
        'usuario_id',
        'fecha',
        'nota',
    ];

    protected $casts = [
        // Es la fecha de la actuación, sin hora: así <input type="date"> la
        // consume tal cual.
        'fecha' => 'date:Y-m-d',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
