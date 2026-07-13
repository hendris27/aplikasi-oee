<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'name')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('name', 'user');
            });
        }

        if (Schema::hasColumn('users', 'password')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('password', 'nik');
            });
        }

        if (Schema::hasColumn('users', 'email')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_email_unique');
            });

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('email');
            });
        }

        if (Schema::hasColumn('users', 'email_verified_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('email_verified_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'user')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('user', 'name');
            });
        }

        if (Schema::hasColumn('users', 'nik')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('nik', 'password');
            });
        }

        if (! Schema::hasColumn('users', 'email')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('email')->nullable()->unique();
            });
        }

        if (! Schema::hasColumn('users', 'email_verified_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('email_verified_at')->nullable();
            });
        }
    }
};
