<?php

namespace Tests\Feature;

use App\Models\Bitacora;
use App\Models\Caso;
use App\Models\Documento;
use App\Models\Expediente;
use App\Models\Historial;
use App\Models\HistorialCambio;
use App\Models\Nna;
use App\Models\ObservacionExpediente;
use App\Models\Representante;
use App\Models\User;
use App\Support\ValoresHistorial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use LogicException;
use Tests\TestCase;

class ReglasDeAccesoTest extends TestCase
{
    use RefreshDatabase;

    private const PIN = '1234';

    private User $admin;
    private User $supervisor;
    private User $consejero;
    private User $otroConsejero;
    private Expediente $expediente;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = $this->usuario('administrador', 'admin');
        $this->supervisor = $this->usuario('supervisor', 'supervisor');
        $this->consejero = $this->usuario('consejero', 'consejero');
        $this->otroConsejero = $this->usuario('consejero', 'otro');

        $nna = Nna::create([
            'documento_identidad' => 'V-1',
            'nombres' => 'Ana',
            'apellidos' => 'Pérez',
            'fecha_nacimiento' => '2015-01-01',
            'sexo' => 'Femenino',
        ]);

        $representante = Representante::create([
            'cedula' => 'V-2',
            'nombres' => 'Luis',
            'apellidos' => 'Pérez',
        ]);

        $this->expediente = Expediente::create([
            'codigo' => 'SICEP-URD-000001',
            'nna_id' => $nna->id,
            'representante_id' => $representante->id,
            'fecha' => now()->toDateString(),
            'hora_registro' => '08:00:00',
            'sector' => 'Centro',
            'prioridad' => 'Media',
            'estatus' => 'Registrado',
            'registrado_por' => $this->supervisor->id,
        ]);

        Caso::create([
            'codigo' => 'CASO-000001',
            'expediente_id' => $this->expediente->id,
            'asignado_a' => $this->consejero->id,
            'asignado_por' => $this->supervisor->id,
            'estatus' => 'Pendiente',
        ]);
    }

    public function test_el_supervisor_no_puede_modificar_el_contenido_del_expediente(): void
    {
        $this->actingAs($this->supervisor, 'sanctum')
            ->putJson("/api/expedientes/{$this->expediente->id}", ['sector' => 'Norte'], ['X-PIN' => self::PIN])
            ->assertForbidden();

        $this->assertSame('Centro', $this->expediente->fresh()->sector);
    }

    public function test_el_consejero_asignado_puede_modificar_y_queda_el_cambio_campo_por_campo(): void
    {
        $this->actingAs($this->consejero, 'sanctum')
            ->putJson("/api/expedientes/{$this->expediente->id}", ['sector' => 'Norte'], ['X-PIN' => self::PIN])
            ->assertOk();

        $entrada = Historial::where('registro_tipo', 'Expediente')
            ->where('registro_id', $this->expediente->id)
            ->where('accion', 'Actualización de expediente')
            ->latest('id')
            ->first();

        $this->assertNotNull($entrada);
        $this->assertSame($this->consejero->id, $entrada->usuario_id);
        $this->assertTrue(HistorialCambio::where('historial_id', $entrada->id)
            ->where('campo', 'sector')
            ->where('valor_anterior', 'Centro')
            ->where('valor_nuevo', 'Norte')
            ->exists());
    }

    public function test_un_consejero_que_no_tiene_el_caso_no_puede_modificar_el_expediente(): void
    {
        $this->actingAs($this->otroConsejero, 'sanctum')
            ->putJson("/api/expedientes/{$this->expediente->id}", ['sector' => 'Norte'], ['X-PIN' => self::PIN])
            ->assertForbidden();
    }

    public function test_la_observacion_se_guarda_en_el_expediente_y_en_la_bitacora(): void
    {
        $this->actingAs($this->supervisor, 'sanctum')
            ->postJson("/api/expedientes/{$this->expediente->id}/observaciones", ['texto' => 'Falta el acta de nacimiento'], ['X-PIN' => self::PIN])
            ->assertCreated();

        $this->assertDatabaseHas('observaciones_expediente', [
            'expediente_id' => $this->expediente->id,
            'usuario_id' => $this->supervisor->id,
            'texto' => 'Falta el acta de nacimiento',
        ]);

        $this->assertDatabaseHas('bitacoras', [
            'expediente_id' => $this->expediente->id,
            'usuario_id' => $this->supervisor->id,
            'nota' => 'Falta el acta de nacimiento',
        ]);
    }

    public function test_el_consejero_no_puede_registrar_observaciones(): void
    {
        $this->actingAs($this->consejero, 'sanctum')
            ->postJson("/api/expedientes/{$this->expediente->id}/observaciones", ['texto' => 'Nota'], ['X-PIN' => self::PIN])
            ->assertForbidden();

        $this->assertSame(0, ObservacionExpediente::count());
        $this->assertSame(0, Bitacora::count());
    }

    public function test_el_consejero_no_puede_reasignar_un_caso(): void
    {
        $caso = Caso::first();

        $this->actingAs($this->consejero, 'sanctum')
            ->putJson("/api/casos/{$caso->id}", ['asignado_a' => $this->otroConsejero->id], ['X-PIN' => self::PIN])
            ->assertForbidden();

        $this->assertSame($this->consejero->id, $caso->fresh()->asignado_a);
    }

    public function test_el_supervisor_puede_reasignar_un_caso(): void
    {
        $caso = Caso::first();

        $this->actingAs($this->supervisor, 'sanctum')
            ->putJson("/api/casos/{$caso->id}", ['asignado_a' => $this->otroConsejero->id], ['X-PIN' => self::PIN])
            ->assertOk();

        $this->assertSame($this->otroConsejero->id, $caso->fresh()->asignado_a);
    }

    public function test_solo_quien_redacto_un_borrador_puede_descartarlo(): void
    {
        $documento = Documento::create([
            'expediente_id' => $this->expediente->id,
            'creado_por' => $this->supervisor->id,
            'plantilla' => 'Citación',
            'titulo' => 'Citación',
            'datos' => [],
            'estado' => 'Borrador',
        ]);

        $this->actingAs($this->otroConsejero, 'sanctum')
            ->deleteJson("/api/documentos/{$documento->id}", [], ['X-PIN' => self::PIN])
            ->assertForbidden();

        $this->assertNotNull(Documento::find($documento->id));
    }

    public function test_la_contrasena_debe_combinar_letras_y_numeros_sin_incluir_el_usuario(): void
    {
        $datos = [
            'name' => 'Nuevo',
            'username' => 'nuevo',
            'email' => 'nuevo@sicep.com',
            'pin' => '1234',
            'role' => 'consejero',
        ];

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/usuarios', $datos + ['password' => '12345678'], ['X-PIN' => self::PIN])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/usuarios', $datos + ['password' => 'nuevo12345'], ['X-PIN' => self::PIN])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/usuarios', $datos + ['password' => 'clave2026x'], ['X-PIN' => self::PIN])
            ->assertCreated();
    }

    public function test_el_pin_sigue_siendo_solo_numerico(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/usuarios', [
                'name' => 'Nuevo',
                'username' => 'nuevo',
                'email' => 'nuevo@sicep.com',
                'password' => 'clave2026x',
                'pin' => 'ab12',
                'role' => 'consejero',
            ], ['X-PIN' => self::PIN])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('pin');
    }

    public function test_el_historial_no_puede_modificarse_ni_eliminarse(): void
    {
        $entrada = Historial::create([
            'usuario_id' => $this->admin->id,
            'accion' => 'Prueba',
            'modulo' => 'usuarios',
        ]);

        $this->expectException(LogicException::class);
        $entrada->update(['detalles' => 'alterado']);
    }

    public function test_el_historial_no_guarda_la_contrasena_al_cambiarla(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/usuarios/{$this->consejero->id}", ['password' => 'nueva2026x'], ['X-PIN' => self::PIN])
            ->assertOk();

        $this->assertFalse(HistorialCambio::where('campo', 'password')->where('valor_nuevo', 'like', '%nueva2026x%')->exists());
        $this->assertTrue(HistorialCambio::where('campo', 'password')->where('valor_nuevo', 'cambiada')->exists());
    }

    public function test_la_linea_de_tiempo_del_expediente_incluye_sus_cambios_observaciones_y_bitacora(): void
    {
        $this->actingAs($this->consejero, 'sanctum')
            ->putJson("/api/expedientes/{$this->expediente->id}", ['sector' => 'Norte'], ['X-PIN' => self::PIN])
            ->assertOk();

        $this->actingAs($this->supervisor, 'sanctum')
            ->postJson("/api/expedientes/{$this->expediente->id}/observaciones", ['texto' => 'Revisar'], ['X-PIN' => self::PIN])
            ->assertCreated();

        $respuesta = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/historial/registro/Expediente/{$this->expediente->id}")
            ->assertOk()
            ->json();

        $acciones = collect($respuesta)->pluck('accion');

        $this->assertTrue($acciones->contains('Actualización de expediente'));
        $this->assertTrue($acciones->contains('Observación de expediente'));
    }

    public function test_la_exportacion_del_historial_entrega_una_linea_por_campo_cambiado(): void
    {
        $this->actingAs($this->consejero, 'sanctum')
            ->putJson("/api/expedientes/{$this->expediente->id}", ['sector' => 'Norte'], ['X-PIN' => self::PIN])
            ->assertOk();

        $contenido = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/historial/exportar')
            ->assertOk()
            ->streamedContent();

        $this->assertStringContainsString('Valor anterior', $contenido);
        $this->assertStringContainsString('sector', $contenido);
        $this->assertStringContainsString('Centro', $contenido);
        $this->assertStringContainsString('Norte', $contenido);
    }

    public function test_el_supervisor_puede_cambiar_el_estatus_fisico_pero_no_el_contenido(): void
    {
        $this->actingAs($this->supervisor, 'sanctum')
            ->putJson("/api/expedientes/{$this->expediente->id}", ['estatus_fisico' => 'En Archivo Central'], ['X-PIN' => self::PIN])
            ->assertOk();

        $this->assertSame('En Archivo Central', $this->expediente->fresh()->estatus_fisico);

        $this->actingAs($this->supervisor, 'sanctum')
            ->putJson("/api/expedientes/{$this->expediente->id}", ['estatus_fisico' => 'En Despacho', 'sector' => 'Norte'], ['X-PIN' => self::PIN])
            ->assertForbidden();
    }

    public function test_el_supervisor_recibe_la_lista_de_consejeros_sin_datos_de_cuenta(): void
    {
        $respuesta = $this->actingAs($this->supervisor, 'sanctum')
            ->getJson('/api/casos/consejeros')
            ->assertOk()
            ->json();

        $ids = collect($respuesta)->pluck('id');

        $this->assertTrue($ids->contains($this->consejero->id));
        $this->assertFalse($ids->contains($this->supervisor->id));
        $this->assertArrayNotHasKey('email', $respuesta[0]);
    }

    public function test_el_historial_muestra_el_codigo_del_expediente_y_el_cambio_de_estatus(): void
    {
        $this->actingAs($this->consejero, 'sanctum')
            ->putJson("/api/expedientes/{$this->expediente->id}", ['estatus' => 'Aprobado'], ['X-PIN' => self::PIN])
            ->assertOk();

        $entrada = collect($this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/historial?modulo=expedientes')
            ->assertOk()
            ->json('datos'))->firstWhere('accion', 'Actualización de expediente');

        $this->assertSame('SICEP-URD-000001', $entrada['referencia']);
        $this->assertTrue(collect($entrada['cambios'])->contains(
            fn ($c) => $c['campo'] === 'estatus' && $c['valor_nuevo'] === 'Aprobado'
        ));
    }

    public function test_el_usuario_cambia_su_propia_contrasena_con_contrasena_actual_y_pin(): void
    {
        $this->actingAs($this->consejero, 'sanctum')
            ->postJson('/api/me/password', [
                'password_actual' => 'password',
                'password_nuevo' => 'nueva2026x',
            ], ['X-PIN' => self::PIN])
            ->assertOk();

        $this->assertTrue(Hash::check('nueva2026x', $this->consejero->fresh()->password));
        $this->assertTrue(HistorialCambio::where('campo', 'password')->where('valor_nuevo', 'cambiada')->exists());
        $this->assertFalse(HistorialCambio::where('valor_nuevo', 'like', '%nueva2026x%')->exists());
    }

    public function test_el_cambio_de_contrasena_propia_exige_la_actual_correcta_y_un_pin(): void
    {
        $this->actingAs($this->consejero, 'sanctum')
            ->postJson('/api/me/password', [
                'password_actual' => 'incorrecta1',
                'password_nuevo' => 'nueva2026x',
            ], ['X-PIN' => self::PIN])
            ->assertUnprocessable()
            ->assertJsonPath('password_invalida', true);

        $this->actingAs($this->consejero, 'sanctum')
            ->postJson('/api/me/password', [
                'password_actual' => 'password',
                'password_nuevo' => 'nueva2026x',
            ])
            ->assertUnauthorized();

        $this->actingAs($this->consejero, 'sanctum')
            ->postJson('/api/me/password', [
                'password_actual' => 'password',
                'password_nuevo' => 'solonumeros',
            ], ['X-PIN' => self::PIN])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password_nuevo');
    }

    public function test_la_asignacion_de_caso_muestra_el_nombre_del_consejero_y_no_su_id(): void
    {
        $this->actingAs($this->supervisor, 'sanctum')
            ->postJson('/api/casos', [
                'expediente_id' => $this->expediente->id,
                'asignado_a' => $this->otroConsejero->id,
                'tipo_asignacion' => 'Manual',
            ], ['X-PIN' => self::PIN])
            ->assertCreated();

        $entrada = collect($this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/historial?modulo=asignacionCasos')
            ->assertOk()
            ->json('datos'))->firstWhere('accion', 'Asignación de caso');

        $cambio = collect($entrada['cambios'])->firstWhere('campo', 'asignado_a');

        $this->assertSame($this->otroConsejero->name, $cambio['valor_nuevo']);
        $this->assertSame($this->expediente->codigo, collect($entrada['cambios'])->firstWhere('campo', 'expediente_id')['valor_nuevo']);
    }

    public function test_todas_las_claves_foraneas_del_esquema_tienen_nombre_en_el_historial(): void
    {
        $sinNombre = [];

        foreach (collect(Schema::getTables())->pluck('name') as $tabla) {
            foreach (Schema::getForeignKeys($tabla) as $clave) {
                foreach ($clave['columns'] as $columna) {
                    if ($columna === 'historial_id') {
                        continue;
                    }

                    if (!array_key_exists($columna, ValoresHistorial::CAMPOS)) {
                        $sinNombre[] = "{$tabla}.{$columna}";
                    }
                }
            }
        }

        $this->assertSame([], $sinNombre, 'Añada estas claves a ValoresHistorial::CAMPOS.');
    }

    private function usuario(string $rol, string $username): User
    {
        return User::factory()->create([
            'username' => $username,
            'role' => $rol,
            'active' => true,
            'pin' => Hash::make(self::PIN),
            'pin_configurado' => true,
        ]);
    }
}
