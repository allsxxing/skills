---
name: ase-tdd
description: Use when implementing any feature or bug fix in testable code, before writing the implementation. Triggers on /tdd.
---

# ASE TDD

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). See NOTICE.md.

Write the test. Watch it fail. Write the minimum code to pass. If you never saw it fail, you do not know it tests the right thing.

Violating the letter of these rules violates the spirit.

## Iron law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Code before the test? Delete it. Do not keep it as reference. Do not adapt it. Rebuild from the tests.

Always: features, bug fixes, refactors, behavior changes. Ask GJ before skipping: throwaway prototypes, generated code, config files.

## Red, green, refactor

**RED.** One minimal test for one behavior. Clear name. Real code, no mocks unless unavoidable. Test names that contain 'and' get split.

**Verify RED (mandatory).** Run it. It must fail, not error, with the expected message, because the feature is missing and not because of a typo. Passes immediately? You are testing existing behavior. Fix the test.

**GREEN.** Simplest code that passes. No extra options, no extra features.

**Verify GREEN (mandatory).** Test passes, other tests pass, output is clean. Failing means fix the code, not the test.

**REFACTOR.** Only after green. Remove duplication, improve names. Stay green. Add no behavior.

Repeat for the next behavior.

## Test rules

- Name the production change that would make this test fail, before writing it.
- Assert real behavior, never mock behavior.
- Keep test-only code out of production classes.
- Understand a dependency's side effects before mocking it.

## Bug fix example

```text
RED:    test('rejects empty email') expects error 'Email required'
Verify: run it, see FAIL: got undefined
GREEN:  if (!data.email?.trim()) return { error: 'Email required' }
Verify: run it, see PASS
```

## Rationalizations

| Excuse | Reality |
|---|---|
| 'Too simple to test' | Simple code breaks. The test takes 30 seconds. |
| 'I will test after' | A test written after passes at once and proves nothing. |
| 'Already tested manually' | Manual runs leave no record and cannot be re-run. |
| 'Deleting hours of work is wasteful' | Sunk cost. Untrusted code is the real waste. |
| 'Keep it as reference' | You will adapt it. That is testing after. |
| 'TDD is dogmatic' | It is the faster path. Debugging later is slower. |

## Red flags, start over

Code before test. Test passes on first run. You cannot say why it failed. Tests 'added later'. 'Just this once.' 'This is different because.'

Any of these means delete the code and restart with a failing test.

## Stuck

| Problem | Move |
|---|---|
| Unsure how to test | Write the API you wish existed, then the assertion |
| Test too complicated | Design too complicated. Simplify the interface |
| Mocking everything | Too coupled. Inject dependencies |

## Done check

- [ ] Every new function has a test
- [ ] Each test was seen failing for the right reason
- [ ] Minimal code per test
- [ ] All tests pass, output clean
- [ ] Edge cases and errors covered

Bug found? Write a failing test that reproduces it first. Never fix a bug without one.
