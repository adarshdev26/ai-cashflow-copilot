import assert from 'node:assert/strict';
import test from 'node:test';
import { getGoalProgress, getGoalStatus, getRequiredMonthlyContribution } from './goals';
import { validateGoalContribution, validateGoalInput } from './validate-goal';

test('progress clamps the displayed percentage and remaining amount', () => {
    assert.deepEqual(getGoalProgress(45_000, 100_000), {
        percentageCompleted: 45,
        remainingAmount: 55_000,
    });
    assert.deepEqual(getGoalProgress(95_000, 100_000), {
        percentageCompleted: 95,
        remainingAmount: 5_000,
    });
    assert.deepEqual(getGoalProgress(120, 100), { percentageCompleted: 100, remainingAmount: 0 });
    assert.deepEqual(getGoalProgress(5, 0), { percentageCompleted: 0, remainingAmount: 0 });
});

test('monthly contribution counts the current month and rounds up to paise', () => {
    assert.equal(
        getRequiredMonthlyContribution(0, 10_000, '2026-10-31', new Date(2026, 9, 7)),
        10_000,
    );
    assert.equal(
        getRequiredMonthlyContribution(0, 10_000, '2026-11-30', new Date(2026, 9, 7)),
        5_000,
    );
    assert.equal(getRequiredMonthlyContribution(0, 10, '2026-11-30', new Date(2026, 9, 7)), 5);
    assert.equal(
        getRequiredMonthlyContribution(0, 10_000, new Date('2026-11-30T12:00:00Z'), new Date(2026, 9, 7)),
        5_000,
    );
});

test('past targets return null monthly contribution and overdue status', () => {
    const today = new Date(2026, 9, 7);
    assert.equal(getRequiredMonthlyContribution(0, 10_000, '2026-10-06', today), null);
    assert.equal(getGoalStatus('ACTIVE', 0, 10_000, '2026-10-06', today), 'OVERDUE');
});

test('completion takes precedence over overdue and archive takes precedence over completion', () => {
    const today = new Date(2026, 9, 7);
    assert.equal(getGoalStatus('ACTIVE', 10_000, 10_000, '2026-10-01', today), 'COMPLETED');
    assert.equal(getGoalStatus('ARCHIVED', 10_000, 10_000, '2026-10-01', today), 'ARCHIVED');
    assert.equal(getRequiredMonthlyContribution(10_000, 10_000, '2026-10-01', today), 0);
});

test('goal validation rejects invalid amounts and dates', () => {
    const validGoal = { name: 'Emergency Fund', targetAmount: 100_000, targetDate: '2026-12-01' };
    for (const targetAmount of [0, -1, Number.NaN, 1_000_000_001]) {
        assert.equal(validateGoalInput({ ...validGoal, targetAmount }).ok, false);
    }
    for (const targetDate of ['2026-02-30', '2026/12/01', 'not-a-date']) {
        assert.equal(validateGoalInput({ ...validGoal, targetDate }).ok, false);
    }
    assert.equal(validateGoalInput({ ...validGoal, name: '   ' }).ok, false);
    assert.equal(validateGoalInput({ ...validGoal, name: 'x'.repeat(101) }).ok, false);
});

test('contribution validation enforces a valid operation and amount limit', () => {
    for (const amount of [0, -1, Number.NaN, 1_000_000_001]) {
        assert.equal(validateGoalContribution({ kind: 'ADD', amount }).ok, false);
    }
    assert.equal(validateGoalContribution({ kind: 'TRANSFER', amount: 1 }).ok, false);
    const result = validateGoalContribution({ kind: 'ADD', amount: 1.239 });
    assert.deepEqual(result, { ok: true, value: { kind: 'ADD', amount: 1.24 } });
});