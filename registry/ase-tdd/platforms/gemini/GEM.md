## Name
ASE TDD

## Description
Use when implementing any feature or bug fix in testable code, before writing the implementation. Triggers on /tdd.

## Instructions

You are running the skill 'ase-tdd'. Follow it exactly.

Triggers: /tdd.

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). Full MIT notice lives with the canonical copy in the allsxxing/skills registry.

Write the test. Watch it fail. Write the minimum code to pass. If you never saw it fail, you do not know it tests the right thing.

Violating the letter of these rules violates the spirit.

### Iron law
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.

Code before the test? Delete it. Do not keep it as reference. Do not adapt it. Rebuild from the tests.

Always: features, bug fixes, refactors, behavior changes. Ask GJ before skipping: throwaway prototypes, generated code, config files.

### Red, green, refactor
RED. One minimal test for one behavior. Clear name. Real code, no mocks unless unavoidable. Test names that contain 'and' get split.

Verify RED (mandatory). Run it. It must fail, not error, with the expected message, because the feature is missing and not because of a typo. Passes immediately? You are testing existing behavior. Fix the test.

GREEN. Simplest code that passes. No extra options, no extra features.

Verify GREEN (mandatory). Test passes, other tests pass, output is clean. Failing means fix the code, not the test.

REFACTOR. Only after green. Remove duplication, improve names. Stay green. Add no behavior.

Repeat for the next behavior.

If this app cannot run code, give GJ the exact command and wait for the pasted output before treating RED or GREEN as verified.

### Test rules
- Name the production change that would make this test fail, before writing it.
- Assert real behavior, never mock behavior.
- Keep test-only code out of production classes.
- Understand a dependency's side effects before mocking it.

### Bug fix example
RED: test('rejects empty email') expects error 'Email required'
Verify: run it, see FAIL: got undefined
GREEN: if (!data.email?.trim()) return { error: 'Email required' }
Verify: run it, see PASS

### Rationalizations
- 'Too simple to test': simple code breaks. The test takes 30 seconds.
- 'I will test after': a test written after passes at once and proves nothing.
- 'Already tested manually': manual runs leave no record and cannot be re-run.
- 'Deleting hours of work is wasteful': sunk cost. Untrusted code is the real waste.
- 'Keep it as reference': you will adapt it. That is testing after.
- 'TDD is dogmatic': it is the faster path. Debugging later is slower.

### Red flags, start over
Code before test. Test passes on first run. You cannot say why it failed. Tests 'added later'. 'Just this once.' 'This is different because.'

Any of these means delete the code and restart with a failing test.

### Stuck
- Unsure how to test: write the API you wish existed, then the assertion.
- Test too complicated: design too complicated. Simplify the interface.
- Mocking everything: too coupled. Inject dependencies.

### Done check
- Every new function has a test
- Each test was seen failing for the right reason
- Minimal code per test
- All tests pass, output clean
- Edge cases and errors covered

Bug found? Write a failing test that reproduces it first. Never fix a bug without one.
