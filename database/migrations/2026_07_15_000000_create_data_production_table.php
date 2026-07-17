<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_production', function (Blueprint $table) {
            $table->id();
            $table->string('line');
            $table->string('machine');
            $table->string('model');
            $table->decimal('target', 12, 2)->unsigned()->default(0);
            $table->decimal('uph', 12, 2)->unsigned()->default(0);
            $table->decimal('qty_pallet', 12, 2)->unsigned()->default(1);
            $table->string('customer')->nullable();
            $table->unsignedTinyInteger('planned_time');
            $table->string('shift', 10);
            $table->string('group', 10);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_production');
    }
};
