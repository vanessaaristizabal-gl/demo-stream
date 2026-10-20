<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('provider');
            $table->string('external_id');
            $table->string('dealer_name');
            $table->string('manufacturer')->nullable()->index();
            $table->timestamps();
            $table->unique(['provider', 'external_id']);
        });

        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_account_id')->constrained()->cascadeOnDelete();
            $table->string('external_id');
            $table->string('name');
            $table->string('type');
            $table->string('status');
            $table->json('desired')->nullable();
            $table->json('live');
            $table->json('locks')->nullable();
            $table->timestamp('adopted_at')->nullable();
            $table->timestamps();
            $table->unique(['ad_account_id', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('ad_accounts');
    }
};
