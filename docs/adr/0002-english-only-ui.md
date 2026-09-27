# English-only UI, no i18n

The glossary, the code and the user interface are all in English, like Linear, even though the users are Brazilian and the project rules are written in Portuguese. There is no i18n layer for now: strings are written directly. Dates and numbers follow the browser's locale, so Brazilian users see Brazilian formats.

## Consequences

Adding a second language later means extracting every UI string, so the cost grows with the size of the app.
