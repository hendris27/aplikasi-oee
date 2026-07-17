<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('oee_records', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('date')->nullable();
            $table->string('line')->nullable();
            $table->string('machine')->nullable();
            $table->string('operator')->nullable();
            $table->string('model')->nullable();
            $table->string('customer')->nullable();
            $table->string('start')->nullable();
            $table->string('shift')->nullable();
            $table->string('group')->nullable();
            $table->string('oee')->nullable();
            $table->string('avb')->nullable();
            $table->string('pfm')->nullable();
            $table->string('qly')->nullable();
            $table->string('acv')->nullable();
            $table->string('real_cycle')->nullable();
            $table->string('std_cycle')->nullable();
            $table->string('good')->nullable();
            $table->string('ng')->nullable();
            $table->string('run_time')->nullable();
            $table->string('down_time')->nullable();
            $table->string('setup_time')->nullable();
            $table->string('stop_time')->nullable();
            $table->json('downtime_logs')->nullable();
            $table->json('ng_logs')->nullable();
            $table->json('production_history')->nullable();
            $table->string('source_index')->nullable();
            $table->timestamps();
        });

        Schema::create('downtime_records', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('date')->nullable();
            $table->string('line')->nullable();
            $table->string('machine')->nullable();
            $table->string('model')->nullable();
            $table->string('type')->nullable();
            $table->string('detail')->nullable();
            $table->string('time')->nullable();
            $table->string('period')->nullable();
            $table->string('tech')->nullable();
            $table->string('job')->nullable();
            $table->string('executor')->nullable();
            $table->string('solution')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('downtime_records');
        Schema::dropIfExists('oee_records');
    }
};
