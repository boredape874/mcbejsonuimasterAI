# Server-form search regression pattern

This is a locally reconstructed static contract, not Bedrock runtime evidence.

- `current` means only the active `form_buttons` collection is searchable.
- `all` requires a sender-provided aggregate collection such as `all_form_buttons`.
- The evidenced expression is case-sensitive. Korean/mixed normalization remains unresolved.
- Filtering must preserve the original `collection_index`; visible-row ordinals are not response indexes.
