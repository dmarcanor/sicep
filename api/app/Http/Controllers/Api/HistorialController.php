<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Historial;
use Illuminate\Http\Request;

class HistorialController extends Controller
{
    public function index(Request $request)
    {
        $query = Historial::with('usuario');

        if ($request->has('modulo')) {
            $query->where('modulo', $request->modulo);
        }

        if ($request->has('usuario_id')) {
            $query->where('usuario_id', $request->usuario_id);
        }

        if ($request->has('fecha_desde')) {
            $query->where('created_at', '>=', $request->fecha_desde);
        }

        if ($request->has('fecha_hasta')) {
            $query->where('created_at', '<=', $request->fecha_hasta);
        }

        return response()->json($query->orderBy('created_at', 'desc')->limit(100)->get());
    }
}
