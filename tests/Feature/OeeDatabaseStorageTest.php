<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OeeDatabaseStorageTest extends TestCase
{
    use RefreshDatabase;

    public function test_oee_and_downtime_records_can_be_saved_and_read_via_api(): void
    {
        $oeePayload = [
            'id' => 'oee-001',
            'date' => '2026-07-16',
            'line' => 'L1',
            'machine' => 'M1',
            'operator' => 'Shift 1 / Group A',
            'model' => 'MODEL-1',
            'customer' => 'CUST-A',
            'start' => '08:00',
            'shift' => '1',
            'group' => 'A',
            'oee' => '85.5',
            'avb' => '90',
            'pfm' => '95',
            'qly' => '100',
            'acv' => '0',
            'real_cycle' => '6.0',
            'std_cycle' => '5.5',
            'good' => '100',
            'ng' => '2',
            'run_time' => '480',
            'down_time' => '20',
            'setup_time' => '00:10:00',
            'stop_time' => '00:20:00',
        ];

        $response = $this->postJson('/api/save-oee', $oeePayload);
        $response->assertOk();
        $response->assertJson(['ok' => true]);
        $this->assertDatabaseHas('oee_records', [
            'id' => 'oee-001',
            'line' => 'L1',
            'model' => 'MODEL-1',
        ]);

        $readResponse = $this->getJson('/api/read-oee');
        $readResponse->assertOk();
        $this->assertTrue(collect($readResponse->json())->contains(fn ($record) => ($record['id'] ?? null) === 'oee-001'));

        $downtimePayload = [
            'id' => 'dt-001',
            'date' => '2026-07-16',
            'line' => 'L1',
            'machine' => 'M1',
            'model' => 'MODEL-1',
            'type' => 'DOWN',
            'detail' => 'Sensor error',
            'time' => '09:00',
            'period' => '00:15:00',
            'tech' => 'Tech 1',
            'job' => 'Check',
            'executor' => 'Operator',
            'solution' => 'Replace sensor',
        ];

        $downtimeResponse = $this->postJson('/api/save-downtime', $downtimePayload);
        $downtimeResponse->assertOk();
        $this->assertDatabaseHas('downtime_records', [
            'id' => 'dt-001',
            'line' => 'L1',
            'detail' => 'Sensor error',
        ]);

        $downtimeReadResponse = $this->getJson('/api/read-downtime');
        $downtimeReadResponse->assertOk();
        $this->assertTrue(collect($downtimeReadResponse->json())->contains(fn ($record) => ($record['id'] ?? null) === 'dt-001'));
    }

    public function test_production_settings_are_created_and_can_be_updated(): void
    {
        $payload = [
            'line' => 'LINE-1',
            'machine' => 'MACHINE-1',
            'model' => 'MODEL-1',
            'target' => 600,
            'uph' => 100,
            'qty_pallet' => 2,
            'customer' => 'CUSTOMER-1',
            'planned_time' => 8,
            'shift' => '1',
            'group' => 'A',
        ];

        $createResponse = $this->postJson('/api/save-production', $payload);
        $createResponse->assertOk()->assertJson(['ok' => true]);
        $productionId = $createResponse->json('id');

        $this->assertDatabaseHas('data_production', [
            'id' => $productionId,
            'line' => 'LINE-1',
            'target' => 600,
        ]);

        $updateResponse = $this->postJson('/api/save-production', [
            ...$payload,
            'id' => $productionId,
            'target' => 700,
        ]);
        $updateResponse->assertOk()->assertJson(['ok' => true, 'id' => $productionId]);

        $this->assertDatabaseHas('data_production', [
            'id' => $productionId,
            'target' => 700,
        ]);
        $this->assertDatabaseCount('data_production', 1);
    }

    public function test_oee_record_can_be_deleted_from_the_table_api(): void
    {
        $this->postJson('/api/save-oee', [
            'id' => 'oee-delete-001',
            'date' => '2026-07-16',
            'line' => 'L1',
            'machine' => 'M1',
            'model' => 'MODEL-DELETE',
        ])->assertOk();

        $this->assertDatabaseHas('oee_records', ['id' => 'oee-delete-001']);

        $this->deleteJson('/api/delete-oee?id=oee-delete-001')
            ->assertOk()
            ->assertJson([
                'ok' => true,
                'deleted' => true,
            ]);

        $this->assertDatabaseMissing('oee_records', ['id' => 'oee-delete-001']);
    }

    public function test_oee_record_can_be_deleted_by_fingerprint_when_ui_id_is_stale(): void
    {
        $payload = [
            'id' => 'database-id-001',
            'date' => '2026-07-16',
            'line' => 'L1',
            'machine' => 'M1',
            'model' => 'MODEL-FINGERPRINT',
            'start' => '2026-07-16 08:00:00',
            'stop_time' => '2026-07-16 09:00:00',
        ];

        $this->postJson('/api/save-oee', $payload)->assertOk();
        $this->assertDatabaseHas('oee_records', ['id' => 'database-id-001']);

        $this->postJson('/api/delete-oee', [
            ...$payload,
            'id' => 'stale-ui-id',
        ])->assertOk()->assertJson([
            'ok' => true,
            'deleted' => true,
        ]);

        $this->assertDatabaseMissing('oee_records', ['id' => 'database-id-001']);
    }
}
