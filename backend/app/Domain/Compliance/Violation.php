<?php

namespace App\Domain\Compliance;

final readonly class Violation
{
    public function __construct(
        public int $rulebookId,
        public string $ruleId,
        public string $field,
        public string $message,
    ) {}

    public function toArray(): array
    {
        return ['rulebook_id' => $this->rulebookId, 'rule_id' => $this->ruleId, 'field' => $this->field, 'message' => $this->message];
    }
}
