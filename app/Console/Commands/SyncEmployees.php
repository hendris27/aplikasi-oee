<?php

namespace App\Console\Commands;

use App\Models\ExternalEmployee;
use App\Models\User;
use Illuminate\Console\Command;

class SyncEmployees extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync-employees';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sinkronkan NIK karyawan aktif dari database training';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Sinkronisasi karyawan dimulai...');

        $created = 0;
        $existing = 0;
        $skipped = 0;

        ExternalEmployee::query()
            ->whereIn('Employee_Status', [1, 2, 3])
            ->whereNotNull('user_login')
            ->where('user_login', '!=', '')
            ->orderBy('ID')
            ->chunkById(250, function ($employees) use (&$created, &$existing, &$skipped) {
                foreach ($employees as $employee) {
                    $nik = trim((string) $employee->user_login);

                    if ($nik === '') {
                        $skipped++;

                        continue;
                    }

                    if (User::where('user', $nik)->exists()) {
                        $existing++;

                        continue;
                    }

                    User::create([
                        'user' => $nik,
                        'nik' => $nik,
                    ]);
                    $created++;
                }
            }, 'ID');

        $this->newLine();
        $this->table(
            ['Dibuat', 'Sudah ada', 'Dilewati'],
            [[$created, $existing, $skipped]],
        );
        $this->info('Sinkronisasi karyawan selesai.');

        return self::SUCCESS;
    }
}
