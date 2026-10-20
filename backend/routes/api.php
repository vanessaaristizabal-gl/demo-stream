<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\ChangelogController;
use App\Http\Controllers\Api\ChangeRequestController;
use App\Http\Controllers\Api\SandboxController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);

    Route::get('campaigns', [CampaignController::class, 'index']);
    Route::get('campaigns/{campaign}', [CampaignController::class, 'show']);
    Route::post('campaigns/{campaign}/changes', [ChangeRequestController::class, 'store']);

    Route::get('change-requests', [ChangeRequestController::class, 'index']);
    Route::middleware('role:approver,admin')->group(function () {
        Route::post('change-requests/{changeRequest}/approve', [ChangeRequestController::class, 'approve']);
        Route::post('change-requests/{changeRequest}/reject', [ChangeRequestController::class, 'reject']);
    });

    // Demo sandbox: simulated Google Ads / Meta campaigns. Not the governed write path; never reaches a real account.
    Route::get('sandbox/catalog', [SandboxController::class, 'catalog']);
    Route::get('sandbox/campaigns', [SandboxController::class, 'index']);
    Route::post('sandbox/campaigns', [SandboxController::class, 'store']);
    Route::get('sandbox/campaigns/{sandboxCampaign}', [SandboxController::class, 'show']);
    Route::patch('sandbox/campaigns/{sandboxCampaign}', [SandboxController::class, 'update']);
    Route::delete('sandbox/campaigns/{sandboxCampaign}', [SandboxController::class, 'destroy']);

    Route::get('changelog', [ChangelogController::class, 'index']);
    Route::get('emergency-stop', [AdminController::class, 'emergencyStop']);
    Route::get('rulebooks', [AdminController::class, 'rulebooks']);
    Route::get('compliance/findings', [AdminController::class, 'findings']);

    Route::middleware('role:admin')->group(function () {
        Route::post('emergency-stop', [AdminController::class, 'setEmergencyStop']);
        Route::post('rulebooks', [AdminController::class, 'storeRulebook']);
        Route::post('compliance/sweep', [AdminController::class, 'sweep']);
        Route::post('playbooks/{playbook}/render', [AdminController::class, 'renderPlaybook']);
    });
});
