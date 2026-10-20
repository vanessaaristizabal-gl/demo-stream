<?php

namespace App\Domain\Playbooks;

use InvalidArgumentException;

/**
 * Renders a campaign configuration from a template. Strings may contain {{ dot.path }}
 * placeholders resolved against the context (dealer, inventory, offers...). Rendering is
 * strict: an unresolved placeholder raises instead of shipping a half-filled ad.
 * A string that is exactly one placeholder keeps the resolved value's type.
 */
class PlaybookRenderer
{
    public function render(array $template, array $context): array
    {
        return array_map(fn ($node) => $this->node($node, $context), $template);
    }

    private function node(mixed $node, array $context): mixed
    {
        if (is_array($node)) {
            return array_map(fn ($child) => $this->node($child, $context), $node);
        }
        if (! is_string($node)) {
            return $node;
        }

        if (preg_match('/^\{\{\s*([\w.]+)\s*\}\}$/', $node, $m)) {
            return $this->resolve($m[1], $context);
        }

        return preg_replace_callback(
            '/\{\{\s*([\w.]+)\s*\}\}/',
            function (array $m) use ($context) {
                $value = $this->resolve($m[1], $context);
                if (! is_scalar($value)) {
                    throw new InvalidArgumentException("Placeholder [{$m[1]}] is not a scalar and cannot be embedded in text.");
                }

                return (string) $value;
            },
            $node,
        );
    }

    private function resolve(string $path, array $context): mixed
    {
        $value = $context;
        foreach (explode('.', $path) as $segment) {
            if (! is_array($value) || ! array_key_exists($segment, $value)) {
                throw new InvalidArgumentException("Missing template variable [{$path}].");
            }
            $value = $value[$segment];
        }

        return $value;
    }
}
