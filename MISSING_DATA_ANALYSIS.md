# Missing Data Scenarios - Complete Analysis

## Date: October 10, 2025
## Status: ✅ ALL CASES TESTED AND VERIFIED

## Summary

This document comprehensively analyzes all combinations of missing genome data and missing effect allele data, with test coverage for each scenario.

## Test Coverage

**Total Tests: 132 (all passing)**
- `missingDataCombinations.test.ts` - 25 tests (NEW)
- `zygosityDetermination.test.ts` - 38 tests
- `missingEffectAllele.test.ts` - 5 tests
- `templateProcessor.test.ts` - 43 tests
- `geneticDataParser.test.ts` - 21 tests

## Four Main Scenarios

### Scenario 1: Genome Data Present + Effect Allele Present ✅
**Expected Outcome:** Normal zygosity determination based on effect allele

| Genome | Effect Allele | Result | Display |
|--------|---------------|--------|---------|
| GG | G | Homozygous | `RS123 ☁️ Homozygous (Alleles: GG, Effect: G, Gene: TEST)` |
| GA | G | Heterozygous | `RS123 ☁ Heterozygous (Alleles: GA, Effect: G, Gene: TEST)` |
| AG | G | Heterozygous | `RS123 ☁ Heterozygous (Alleles: AG, Effect: G, Gene: TEST)` |
| AA | G | Wild | `RS123 Wild` |
| TT | G | Wild | `RS123 Wild` |

**Logic:** 
- Both alleles match effect → Homozygous
- One allele matches effect → Heterozygous  
- Neither allele matches effect → Wild

---

### Scenario 2: Genome Data Present + Effect Allele Missing ✅
**Expected Outcome:** Fallback to basic homo/hetero logic (cannot determine Wild type)

#### Case 2a: Effect Allele is Empty String
| Genome | Effect Allele | Result | Display |
|--------|---------------|--------|---------|
| AA | `""` | Homozygous | `RS456 ☁️ Homozygous (Alleles: AA, Gene: TEST)` |
| AG | `""` | Heterozygous | `RS456 ☁ Heterozygous (Alleles: AG, Gene: TEST)` |
| TT | `""` | Homozygous | `RS456 ☁️ Homozygous (Alleles: TT, Gene: TEST)` |
| TC | `""` | Heterozygous | `RS456 ☁ Heterozygous (Alleles: TC, Gene: TEST)` |

#### Case 2b: Effect Allele is Undefined
| Genome | Effect Allele | Result | Display |
|--------|---------------|--------|---------|
| TT | `undefined` | Homozygous | `RS789 ☁️ Homozygous (Alleles: TT, Gene: TEST)` |
| TC | `undefined` | Heterozygous | `RS789 ☁ Heterozygous (Alleles: TC, Gene: TEST)` |

#### Case 2c: RS ID Not in Reference at All
| Genome | Effect Allele | Result | Display |
|--------|---------------|--------|---------|
| CC | (not in ref) | Homozygous | `RS999 ☁️ Homozygous (Alleles: CC)` |
| CG | (not in ref) | Heterozygous | `RS999 ☁ Heterozygous (Alleles: CG)` |

**Logic:**
- Both alleles are the same → Homozygous
- Alleles are different → Heterozygous
- Cannot determine Wild type without effect allele

**Note:** Effect allele is NOT displayed in detailed annotations when missing (the `if (effectAllele)` check prevents it)

---

### Scenario 3: Genome Data Missing + Effect Allele Present ✅
**Expected Outcome:** Always returns "Data Missing" (genome data takes priority)

| Genome | Effect Allele | Result | Display |
|--------|---------------|--------|---------|
| `-G` | G | Data Missing | `RS111 [Data Missing]` |
| `G-` | G | Data Missing | `RS111 [Data Missing]` |
| `--` | G | Data Missing | `RS111 [Data Missing]` |
| `(empty)G` | G | Data Missing | `RS111 [Data Missing]` |
| `G(empty)` | G | Data Missing | `RS111 [Data Missing]` |
| `(empty)(empty)` | G | Data Missing | `RS111 [Data Missing]` |
| (not in genome file) | G | Data Missing | `RS111 [Data Missing]` |

**Logic:** Genome data missing is checked FIRST, before any effect allele comparison. Returns "Data Missing" immediately.

**In SNPResult object:**
```typescript
{
  rsId: 'RS111',
  zygosity: 'Data Missing',
  alleles: '--',
  effectAllele: 'G',  // Effect allele IS shown even though genome is missing
  gene: 'TEST'
}
```

**In Report Display:**
- Main text: `RS111 [Data Missing]` (grey text)
- Effect allele and gene info ARE preserved in the result object
- Detailed annotations are NOT shown for Data Missing (only shown for Homo/Hetero)

---

### Scenario 4: Genome Data Missing + Effect Allele Missing ✅
**Expected Outcome:** Always returns "Data Missing" (genome data missing takes priority)

#### Case 4a: Effect Allele Empty String
| Genome | Effect Allele | Result | Display |
|--------|---------------|--------|---------|
| `-G` | `""` | Data Missing | `RS222 [Data Missing]` |
| `(empty)(empty)` | `""` | Data Missing | `RS222 [Data Missing]` |

#### Case 4b: Effect Allele Undefined
| Genome | Effect Allele | Result | Display |
|--------|---------------|--------|---------|
| `--` | `undefined` | Data Missing | `RS333 [Data Missing]` |
| `(empty)(empty)` | `undefined` | Data Missing | `RS333 [Data Missing]` |

#### Case 4c: RS ID Not in Reference
| Genome | Effect Allele | Result | Display |
|--------|---------------|--------|---------|
| `--` | (not in ref) | Data Missing | `RS444 [Data Missing]` |
| `(empty)(empty)` | (not in ref) | Data Missing | `RS444 [Data Missing]` |
| (not in genome file) | (not in ref) | Data Missing | `RS444 [Data Missing]` |

**Logic:** Genome data missing check happens FIRST, returns "Data Missing" before even looking at effect allele.

**In SNPResult object:**
```typescript
{
  rsId: 'RS222',
  zygosity: 'Data Missing',
  alleles: '--',
  effectAllele: '',      // Empty or undefined
  gene: 'TEST'
}
```

---

## Decision Tree

```
START: Process RS ID
│
├─ Is genome data missing (-, empty, or not in file)?
│  ├─ YES → Return "Data Missing" ✅ (STOP - don't check effect allele)
│  └─ NO → Continue
│
├─ Does RS ID have valid effect allele (present, non-empty)?
│  ├─ YES → Use effect allele logic
│  │   ├─ Both alleles match effect? → Homozygous ✅
│  │   ├─ One allele matches effect? → Heterozygous ✅
│  │   └─ Neither matches effect? → Wild ✅
│  │
│  └─ NO (empty, undefined, or not in reference) → Use basic logic
│      ├─ Both alleles same? → Homozygous ✅
│      └─ Alleles different? → Heterozygous ✅
│
END
```

## Code Flow Analysis

### 1. `getSNPResults()` function:
```typescript
for (const rsId of rsIds) {
  const data = geneticData[rsId.toUpperCase()];
  const reference = alleleReference.find(...);

  if (!data) {
    // SCENARIO 3 & 4: Genome data missing
    return {
      zygosity: 'Data Missing',
      alleles: '--',
      effectAllele: reference?.problemAllele,  // May be present or absent
      gene: reference?.gene
    };
  }

  // SCENARIO 1 & 2: Genome data present, call determineZygosity
  const zygosity = determineZygosity(data.allele1, data.allele2, rsId, alleleReference);
}
```

### 2. `determineZygosity()` function:
```typescript
// First check: Genome data validity (SCENARIO 3 & 4 already filtered by getSNPResults)
if (allele1 === '-' || allele2 === '-' || !allele1 || !allele2) {
  return 'Data Missing';
}

// Second check: Effect allele availability
if (reference?.problemAllele && reference.problemAllele.trim() !== '') {
  // SCENARIO 1: Use effect allele logic
  // ... check matches ...
} else {
  // SCENARIO 2: Use basic logic (no valid effect allele)
  if (normalizedAllele1 === normalizedAllele2) {
    return 'Homozygous';
  } else {
    return 'Heterozygous';
  }
}
```

## Priority Order

1. **Genome Data Missing** (highest priority) → Always "Data Missing"
2. **Effect Allele Present** → Use effect-based logic (Homo/Hetero/Wild)
3. **Effect Allele Missing** → Use basic logic (Homo/Hetero only)

## Key Insights

### ✅ Genome Data Takes Precedence
If genome data is missing, the result is ALWAYS "Data Missing", regardless of whether an effect allele exists.

### ✅ Effect Allele is Optional
The system gracefully handles missing effect alleles by falling back to basic genotype analysis.

### ✅ Three Possible "Missing Effect Allele" Scenarios
1. Empty string `""` in the reference file
2. Undefined (property not present)
3. RS ID not in reference file at all

All three are handled identically - fallback to basic logic.

### ✅ "Data Missing" Display
- Shows in grey text: `RS123 [Data Missing]`
- Never shows detailed annotations (those only appear for variants)
- Effect allele info is preserved in the data structure but not displayed

### ✅ No "Wild" Without Effect Allele
You cannot determine "Wild type" without knowing what the effect allele is. When effect allele is missing, only Homozygous (matching alleles) or Heterozygous (different alleles) can be determined.

## Visual Summary in Reports

### When Effect Allele Exists:
- 🔴 `RS123 ☁️ Homozygous` (both alleles match effect)
- 🟡 `RS123 ☁ Heterozygous` (one allele matches effect)
- ⚫ `RS123 Wild` (neither allele matches effect)

### When Effect Allele Missing:
- 🔴 `RS456 ☁️ Homozygous` (both alleles match each other)
- 🟡 `RS456 ☁ Heterozygous` (alleles differ)
- ❌ Cannot show "Wild" (no effect allele to compare against)

### When Genome Data Missing:
- ⚪ `RS789 [Data Missing]` (grey, no icons, no variants shown)

## Test Verification

All 132 tests pass, confirming:
✅ All four main scenarios work correctly
✅ All edge cases (empty string, undefined, not in reference) work correctly  
✅ Priority ordering is correct (genome data checked first)
✅ Fallback logic works when effect allele is missing
✅ Effect allele is preserved in results even when genome is missing
✅ Display formatting is correct for all cases

