# Spec: Template field with a character limit
Component: features/lab/components/TemplateField

An administrator writes ad copy such as `{{ dealer.name }} - 0% APR this month`. Placeholders are filled in when the ad is built, so the limit of 30 characters applies to the text AFTER substitution, not to what was typed.

## States
- empty
- valid
- over-limit
- unknown-placeholder

## Acceptance criteria
- AC-1: The field has a visible label and shows how many characters the filled-in text has out of 30, for the selected dealer.
- AC-2: The preview shows the template with every placeholder replaced by the selected dealer's value.
- AC-3: Changing the selected dealer recalculates the preview and the count.
- AC-4: When the filled-in text is longer than 30 characters the field is marked invalid and an error says by how many characters it is over.
- AC-5: The count and the error are announced to assistive technology, and the error is associated with the field.
- AC-6: A placeholder that does not exist (for example `{{ dealer.nme }}`) is reported by name, and the preview is not shown as if it were final.
- AC-7: The screen lists every dealer for which the filled-in text would exceed the limit, so a template valid for one dealer is not silently too long for another.
- AC-8: An empty template shows a hint and no error.

## Edge cases
- AC-9: A text of exactly 30 filled-in characters is valid; 31 is not.
- AC-10: The same placeholder may appear twice, and both are counted.
- AC-11: Typed text is rendered as plain text, never as HTML.

- AC-12: Leftover braces that are not a well-formed placeholder (for example `{{ dealer.name }`) are reported, and the preview is not shown as final.
- AC-13: A template of only spaces counts as empty: the hint shows and no error does.

## Out of scope
Saving the template, other placeholders than `dealer.name` and `dealer.city`, translation, and rich text.
