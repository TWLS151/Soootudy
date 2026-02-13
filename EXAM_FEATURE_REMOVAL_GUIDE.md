# 시험 대비 기능 삭제 가이드

시험이 끝난 후 아래 순서대로 제거하면 됩니다.

---

## 1. Supabase 데이터 삭제

Supabase Dashboard → SQL Editor에서 실행:

```sql
DELETE FROM daily_problem WHERE date IS NULL;
```

(선택) date 컬럼을 다시 NOT NULL로 되돌리려면:

```sql
ALTER TABLE daily_problem ALTER COLUMN date SET NOT NULL;
```

---

## 2. 파일 삭제

```
web/src/pages/ExamPage.tsx   ← 파일 전체 삭제
```

---

## 3. App.tsx 수정

`web/src/App.tsx`에서 아래 2줄 제거:

```tsx
import ExamPage from './pages/ExamPage'; // --- 시험 대비 (임시) ---
```

```tsx
<Route path="exam" element={<ExamPage />} /> {/* --- 시험 대비 (임시) --- */}
```

---

## 4. Sidebar.tsx 수정

`web/src/components/Sidebar.tsx`에서 아래 부분 제거:

- import에서 `BookOpen` 제거 (다른 곳에서 안 쓰면)
- `{/* --- 시험 대비 링크 (임시) --- */}` ~ `{/* --- 시험 대비 링크 끝 --- */}` 사이 전체 삭제

---

## 5. AdminPage.tsx 수정

`web/src/pages/AdminPage.tsx`에서 아래 부분 제거:

- `{/* --- 시험 대비 문제 관리 (임시) --- */}` ~ `{/* --- 시험 대비 문제 관리 끝 --- */}` 사이 전체 삭제
- 관련 state 변수 삭제: `examProblems`, `showExamForm`, `examSource`, `examNumber`, `examTitle`, `examUrl`, `examSubmitting`, `examDeleteId`
- 관련 함수 삭제: `loadExamProblems()`, `handleExamAdd()`, `handleExamDelete()`
- useEffect에서 `loadExamProblems()` 호출 제거

---

## 6. types 수정 (선택)

`web/src/types/index.ts`에서 `DailyProblem` 인터페이스의 `date`를 다시 필수로:

```tsx
// 변경 전 (현재)
date: string | null;

// 변경 후
date: string;
```

---

## 7. 이 파일 삭제

```
EXAM_FEATURE_REMOVAL_GUIDE.md  ← 이 파일도 삭제
```

---

> 모든 시험 관련 코드에는 `시험 대비` 또는 `exam` 키워드가 포함되어 있으므로, 전체 검색으로 찾을 수 있습니다.
