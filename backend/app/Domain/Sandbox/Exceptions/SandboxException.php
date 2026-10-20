<?php

namespace App\Domain\Sandbox\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

class SandboxException extends RuntimeException
{
    public function __construct(string $message, public readonly string $errorCode, public readonly int $status)
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json(['error' => $this->errorCode, 'message' => $this->getMessage()], $this->status);
    }

    public static function idempotencyConflict(): self
    {
        return new self('This Idempotency-Key was already used for a different campaign.', 'idempotency_conflict', 422);
    }
}
