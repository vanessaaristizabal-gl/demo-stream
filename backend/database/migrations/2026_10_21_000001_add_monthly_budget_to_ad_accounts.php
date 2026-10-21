<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ad_accounts', function (Blueprint $table) {
            // The monthly budget belongs to each account (not to a group of accounts). Integer cents, read from Salesforce; null = none yet.
            $table->unsignedInteger('monthly_budget')->nullable()->after('manufacturer');
        });
    }

    public function down(): void
    {
        Schema::table('ad_accounts', function (Blueprint $table) {
            $table->dropColumn('monthly_budget');
        });
    }
};
