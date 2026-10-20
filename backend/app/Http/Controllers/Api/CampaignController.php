<?php

namespace App\Http\Controllers\Api;

use App\Domain\Advertising\Models\Campaign;
use App\Http\Controllers\Controller;
use App\Http\Resources\CampaignResource;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Campaigns')]
class CampaignController extends Controller
{
    /**
     * List campaigns
     */
    public function index(): JsonResponse
    {
        return CampaignResource::collection(Campaign::query()->with('account')->orderBy('name')->paginate(50))->response();
    }

    /**
     * Get one campaign
     */
    public function show(Campaign $campaign): JsonResponse
    {
        return (new CampaignResource($campaign->load('account')))->response();
    }
}
