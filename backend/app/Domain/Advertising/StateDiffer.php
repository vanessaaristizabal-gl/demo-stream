<?php

namespace App\Domain\Advertising;

class StateDiffer
{
    /**
     * Fields in $desired whose value differs from $live.
     *
     * @return array<string, array{old: mixed, new: mixed}>
     */
    public static function diff(array $live, array $desired): array
    {
        $diff = [];
        foreach ($desired as $field => $new) {
            $old = $live[$field] ?? null;
            if ($old !== $new) {
                $diff[$field] = ['old' => $old, 'new' => $new];
            }
        }

        return $diff;
    }
}
