<?php

namespace App\Domain\Governance\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

class GovernanceException extends RuntimeException
{
    public function __construct(string $message, public readonly string $errorCode, public readonly int $status)
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json(['error' => $this->errorCode, 'message' => $this->getMessage()], $this->status);
    }

    public static function emergencyStop(): self
    {
        return new self('Emergency stop is active: no writes are accepted.', 'emergency_stop', 423);
    }

    public static function fieldLocked(string $field): self
    {
        return new self("Field [{$field}] is locked on this campaign.", 'field_locked', 409);
    }

    public static function selfApproval(): self
    {
        return new self('A change cannot be approved by the person who requested it.', 'self_approval', 403);
    }

    public static function notApprover(): self
    {
        return new self('Only approvers or admins can decide on changes.', 'not_approver', 403);
    }

    public static function invalidTransition(string $detail): self
    {
        return new self($detail, 'invalid_transition', 409);
    }

    public static function idempotencyConflict(): self
    {
        return new self('This Idempotency-Key was already used for a different change.', 'idempotency_conflict', 422);
    }
}
