import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildMonthEnds,
    buildHistoryFromValues,
    computeChangePercent,
    computeMonthlyChange,
    round2,
    splitAccounts,
} from './net-worth';

test('liability sign handling', () => {
    const result = splitAccounts([
        {
            id: 'a1',
            name: 'Credit card',
            type: 'CREDIT_CARD',
            classification: 'LIABILITY',
            balance: -35000,
            amountOwed: 35000,
            currency: 'INR',
            sharePercent: null,
        },
        {
            id: 'a2',
            name: 'Savings',
            type: 'BANK',
            classification: 'ASSET',
            balance: 50000,
            amountOwed: 0,
            currency: 'INR',
            sharePercent: null,
        },
    ]);

    assert.equal(result.totalAssets, 50000);
    assert.equal(result.totalLiabilities, 35000);
    assert.equal(result.netWorth, 15000);
    assert.equal(result.liabilities[0].amountOwed, 35000);
    assert.equal(result.liabilities[0].balance, -35000);
});

test('task example', () => {
    const result = splitAccounts([
        {
            id: 'a1',
            name: 'HDFC',
            type: 'BANK',
            classification: 'ASSET',
            balance: 26669,
            amountOwed: 0,
            currency: 'INR',
            sharePercent: null,
        },
        {
            id: 'a2',
            name: 'Cash',
            type: 'CASH',
            classification: 'ASSET',
            balance: 43535,
            amountOwed: 0,
            currency: 'INR',
            sharePercent: null,
        },
        {
            id: 'a3',
            name: 'Savings',
            type: 'BANK',
            classification: 'ASSET',
            balance: 120000,
            amountOwed: 0,
            currency: 'INR',
            sharePercent: null,
        },
        {
            id: 'a4',
            name: 'Credit Card',
            type: 'CREDIT_CARD',
            classification: 'LIABILITY',
            balance: -35000,
            amountOwed: 35000,
            currency: 'INR',
            sharePercent: null,
        },
        {
            id: 'a5',
            name: 'Loan',
            type: 'OTHER',
            classification: 'LIABILITY',
            balance: -80000,
            amountOwed: 80000,
            currency: 'INR',
            sharePercent: null,
        },
    ]);

    assert.equal(result.totalAssets, 190204);
    assert.equal(result.totalLiabilities, 115000);
    assert.equal(result.netWorth, 75204);
});

test('compute percent change handles null and zero previous values', () => {
    assert.equal(computeMonthlyChange(12000, 10000), 2000);
    assert.equal(computeChangePercent(12000, 10000), 20);
    assert.equal(computeChangePercent(8000, 10000), -20);
    assert.equal(computeChangePercent(100, 0), null);
    assert.equal(computeChangePercent(100, null), null);
    assert.equal(round2(1.234), 1.23);
});

test('month ends include current month and keep oldest-first order', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const points = buildMonthEnds('6m', now, new Date('2026-05-01T00:00:00Z'));
    assert.equal(points.length, 6);
    assert.equal(points[0].label, '2026-05');
    assert.equal(points[points.length - 1].label, '2026-10');
});

test('all range is capped to 60 months', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const points = buildMonthEnds('all', now, new Date('2000-01-01T00:00:00Z'));
    assert.equal(points.length, 60);
    assert.equal(points[0].label, '2021-11');
});

test('history points carry monthly deltas and percent change', () => {
    const history = buildHistoryFromValues(
        '3m',
        [
            { month: '2026-08', netWorth: 1000 },
            { month: '2026-09', netWorth: 1500 },
            { month: '2026-10', netWorth: 1600 },
        ],
        new Date('2026-10-15T12:00:00Z'),
    );

    assert.equal(history[0].month, '2026-08');
    assert.equal(history[2].netWorth, 1600);
    assert.equal(history[2].change, 100);
    assert.equal(history[2].changePercent, 6.67);
});
