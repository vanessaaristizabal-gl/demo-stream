<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Demo sandbox: a simulated Google Ads / Meta account. Deliberately not linked to ad_accounts or campaigns.
        Schema::create('sandbox_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('idempotency_key')->unique();
            $table->string('fingerprint');
            $table->string('platform')->index();
            $table->string('external_id');
            $table->string('name');
            $table->string('goal');
            $table->string('status');
            $table->unsignedBigInteger('daily_budget');
            $table->json('inputs');
            $table->json('structure');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->unique(['platform', 'external_id']);
        });

        Schema::create('sandbox_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sandbox_campaign_id')->constrained('sandbox_campaigns')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedBigInteger('impressions');
            $table->unsignedBigInteger('clicks');
            $table->unsignedBigInteger('cost');
            $table->decimal('conversions', 10, 2);
            $table->unsignedBigInteger('conversions_value');
            $table->unsignedBigInteger('reach')->nullable();
            $table->unique(['sandbox_campaign_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sandbox_metrics');
        Schema::dropIfExists('sandbox_campaigns');
    }
};
