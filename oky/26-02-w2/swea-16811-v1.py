T = int(input())

for tc in range(1, T + 1):
    N = int(input())
    Ci = list(map(int, input().split()))

    Ci.sort()
    
    # 결과값 초기화
    min_diff = N
    L = N // 2

    # 첫 번째 경계선 i (소형 상자의 마지막 인덱스)
    for i in range(1, N - 1):
        # 두 번째 경계선 j (중형 상자의 마지막 인덱스)
        for j in range(i + 1, N):
            # 1) 경계 지점의 당근 크기가 다음 당근과 다르다면
            if Ci[i - 1] != Ci[i] and Ci[j - 1] != Ci[j]:
                
                # 각 상자의 당근 개수 계산
                small_cnt = i
                medium_cnt = j - i
                large_cnt = N - j
                
                # 2) 모든 상자가 N//2를 초과하지 않는다면
                if small_cnt <= L and medium_cnt <= L and large_cnt <= L:
                    # 현재 조합의 최대-최소 차이 계산
                    diff = max(small_cnt, medium_cnt, large_cnt) - min(small_cnt, medium_cnt, large_cnt)
                    
                    # 최솟값 갱신
                    if diff < min_diff:
                        min_diff = diff

    # 조건을 만족하는 경우가 한 번도 없어서 min_diff가 갱신되지 않았다면 -1 반환
    result = min_diff if min_diff != N else -1
    
    print(f'#{tc} {result}')