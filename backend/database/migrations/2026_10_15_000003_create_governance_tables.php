<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rulebooks', function (Blueprint $table) {
            $table->id();
            $table->string('manufacturer')->index();
            $table->unsignedInteger('version');
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->json('rules');
            $table->timestamps();
            $table->unique(['manufacturer', 'version']);
        });

        Schema::create('policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->json('allowed_fields');
            $table->decimal('max_budget_delta_pct', 6, 2)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->foreignId('policy_id')->nullable()->constrained('policies');
            $table->string('idempotency_key')->unique();
            $table->json('changes');
            $table->json('diff')->nullable();
            $table->string('status')->index();
            $table->json('failure')->nullable();
            $table->json('applied')->nullable();
            $table->timestamps();
        });

        Schema::create('changelog_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->string('source');
            $table->foreignId('actor_id')->nullable()->constrained('users');
            $table->foreignId('approver_id')->nullable()->constrained('users');
            $table->foreignId('change_request_id')->nullable()->constrained();
            $table->string('field');
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->timestamp('occurred_at')->index();
            $table->timestamps();
        });

        Schema::create('compliance_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rulebook_id')->constrained();
            $table->string('rule_id');
            $table->string('field');
            $table->string('message');
            $table->timestamp('detected_at');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index(['campaign_id', 'rule_id', 'resolved_at']);
        });

        Schema::create('playbooks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->json('template');
            $table->timestamps();
        });

        Schema::create('system_flags', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->boolean('value')->default(false);
            $table->foreignId('changed_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['system_flags', 'playbooks', 'compliance_findings', 'changelog_entries', 'change_requests', 'policies', 'rulebooks'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
