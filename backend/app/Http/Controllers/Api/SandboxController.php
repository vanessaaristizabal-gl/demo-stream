<?php

namespace App\Http\Controllers\Api;

use App\Domain\Sandbox\Models\SandboxCampaign;
use App\Domain\Sandbox\Services\PlatformCatalog;
use App\Domain\Sandbox\Services\SandboxCampaignService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSandboxCampaignRequest;
use App\Http\Requests\UpdateSandboxCampaignRequest;
use App\Http\Resources\SandboxCampaignDetailResource;
use App\Http\Resources\SandboxCampaignResource;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

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

    /**
     * Edit a simulated campaign
     *
     * Send only the fields to change (name, goal, status `active` or `paused`, daily budget in cents, vehicle, location, landing URL). The platform structure is rebuilt from the result; the external id and the metrics history are kept. Requires an `Idempotency-Key` header; repeating the same change is safe. A sandbox campaign is not subject to approval and never reaches a real account.
     */
    public function update(UpdateSandboxCampaignRequest $request, SandboxCampaign $sandboxCampaign): JsonResponse
    {
        $request->idempotencyKey();

        return (new SandboxCampaignDetailResource($this->campaigns->update($sandboxCampaign, $request->validated())->load('metrics')))->response();
    }

    /**
     * Delete a simulated campaign
     *
     * Removes the campaign and its metrics. Requires an `Idempotency-Key` header. Live campaigns cannot be deleted here: they change only through the governed write path.
     */
    public function destroy(Request $request, SandboxCampaign $sandboxCampaign): Response
    {
        abort_if(blank($request->header('Idempotency-Key')), 422, 'Idempotency-Key header is required.');
        $this->campaigns->delete($sandboxCampaign);

        return response()->noContent();
    }
}
