<?php

namespace App\Http\Controllers\Api;

use App\Domain\Advertising\Models\Campaign;
use App\Domain\Governance\Enums\ChangeStatus;
use App\Domain\Governance\Models\ChangeRequest;
use App\Domain\Governance\WritePath\GovernedWritePath;
use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitChangeRequest;
use App\Http\Resources\ChangeRequestResource;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Governed changes')]
class ChangeRequestController extends Controller
{
    public function __construct(private GovernedWritePath $writePath) {}

    /**
     * List change requests
     */
    public function index(Request $request): JsonResponse
    {
        $query = ChangeRequest::query()->with(['campaign:id,name', 'requester:id,name', 'approver:id,name'])->latest();

        if ($status = $request->query('status')) {
            $query->where('status', ChangeStatus::from($status));
        }

        return ChangeRequestResource::collection($query->paginate(50))->response();
    }

    /**
     * Propose a change to a campaign
     *
     * The only way to change a live account. Requires an `Idempotency-Key` header: repeating the same key with the same body returns the same change, a different body returns 422. The change is checked against live state, field locks, the emergency stop and the manufacturer rulebook, then waits for approval unless a pre-approved policy covers it.
     */
    public function store(SubmitChangeRequest $request, Campaign $campaign): JsonResponse
    {
        $change = $this->writePath->submit($campaign, $request->validated('changes'), $request->user(), $request->idempotencyKey());

        return (new ChangeRequestResource($change->loadMissing(['campaign:id,name', 'requester:id,name', 'approver:id,name'])))
            ->response()->setStatusCode($change->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Approve a pending change and write it to the provider
     *
     * The approver must differ from the requester.
     */
    public function approve(Request $request, ChangeRequest $changeRequest): JsonResponse
    {
        return $this->resource($this->writePath->approve($changeRequest, $request->user()));
    }

    /**
     * Reject a pending change
     */
    public function reject(Request $request, ChangeRequest $changeRequest): JsonResponse
    {
        return $this->resource($this->writePath->reject($changeRequest, $request->user()));
    }

    private function resource(ChangeRequest $changeRequest): JsonResponse
    {
        return (new ChangeRequestResource($changeRequest->loadMissing(['campaign:id,name', 'requester:id,name', 'approver:id,name'])))->response();
    }
}
