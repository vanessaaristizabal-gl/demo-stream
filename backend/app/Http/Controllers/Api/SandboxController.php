<?php

namespace App\Http\Controllers\Api;

use App\Domain\Sandbox\Models\SandboxCampaign;
use App\Domain\Sandbox\Services\PlatformCatalog;
use App\Domain\Sandbox\Services\SandboxCampaignService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSandboxCampaignRequest;
use App\Http\Resources\SandboxCampaignDetailResource;
use App\Http\Resources\SandboxCampaignResource;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Demo sandbox')]
class SandboxController extends Controller
{
    public function __construct(private SandboxCampaignService $campaigns) {}

    /**
     * What each platform calls things
     *
     * For Google Ads and Meta: the campaign hierarchy, the goals a campaign can have, and the metrics each platform reports with their native field names.
     */
    public function catalog(): JsonResponse
    {
        return response()->json(['data' => ['platforms' => PlatformCatalog::all()]]);
    }

    /**
     * List simulated campaigns
     *
     * Each row carries 30-day totals. The sandbox is a demo area: it never reaches a real Google Ads or Meta account.
     */
    public function index(): JsonResponse
    {
        $query = SandboxCampaign::query()->latest('id');
        foreach (['impressions', 'clicks', 'cost', 'conversions', 'conversions_value', 'reach'] as $column) {
            $query->withSum("metrics as {$column}_total", $column);
        }

        return SandboxCampaignResource::collection($query->paginate(50))->response();
    }

    /**
     * Create a simulated campaign
     *
     * Builds the structure the platform would hold (Google Ads: campaign, ad groups, keywords, responsive search ads; Meta: campaign, ad sets, targeting, ads) and 30 days of simulated metrics. Requires an `Idempotency-Key` header: the same key with the same body returns the same campaign, a different body returns 422. This is a sandbox, so it is not subject to approval and never reaches a real account.
     */
    public function store(StoreSandboxCampaignRequest $request): JsonResponse
    {
        $campaign = $this->campaigns->create($request->validated(), $request->idempotencyKey(), $request->user()?->id);

        return (new SandboxCampaignDetailResource($campaign->load('metrics')))
            ->response()->setStatusCode($campaign->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Get one simulated campaign
     *
     * Includes the full platform structure and the daily metrics.
     */
    public function show(SandboxCampaign $sandboxCampaign): JsonResponse
    {
        return (new SandboxCampaignDetailResource($sandboxCampaign->load('metrics')))->response();
    }
}
