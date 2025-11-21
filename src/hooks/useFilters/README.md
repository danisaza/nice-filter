## FUTURE IMPROVEMENTS:

This hook could eventually take a `fetchFilterCategories` function as an argument and handle the
data-fetching on behalf of the caller, using something like react-query to handle the caching and state management.

For now, I'll just let the caller handle the data-fetching.

Also, note that this hook currently assumes that all of the possible values for filters can be provided at once.
This assumption may not hold in situations where a filter could take on a large number of values - like a task
management system with hundreds of possible task owners.

In cases like that, it would be sensible to allow the caller to provide a function that fetches all of the owners
that the tasks could be filtered by, in a paginated way. (to follow the above example)
