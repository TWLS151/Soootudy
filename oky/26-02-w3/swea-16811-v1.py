# IM 14기 기출
# SWEA-16811 당근 포장하기

"""
당근을 정렬한 후 소 상자(i)와 대 상자(N-j)의 수용량 제한(M)을
i, j 루프 범위에 직접 대입하여 불필요한 탐색을 차단하고,
남은 중 상자의 유효성과 크기 중복 여부만 검증하여 최적의 개수 차이를 도출하는 로직
"""
#===================================================================


T = int(input())

for tc in range(1, T + 1):
    N = int(input())
    C = list(map(int, input().split()))
    C.sort()  # 당근 크기순 정렬

    M = N // 2   # 한 상자에 담을 수 있는 최대 개수
    min_dif = N  # 최소 차이 초기값 설정

    # 첫 번째 경계 i (소 상자의 당근 개수와 동일)
    # 소 상자 개수 조건(1 <= i <= M)에 따라 i 범위 설정
    for i in range(1, M + 1):

        # 소, 중 상자의 경계면 값이 같으면 같은 크기가 분리된 것이므로 무효
        if C[i-1] == C[i]:
            continue

        # 두 번째 경계 j (중 상자까지의 누적 당근 개수와 동일)
        # 중 상자 개수: j-i, 대 상자 개수: N-j
        # 대 상자 개수 조건(1 <= N-j <= M)에 따라 j 범위 설정: N-M <= j <= N-1
        for j in range(N - M, N):

            # 중 상자가 비어있거나(j-i==0), M을 초과할 경우 무효
            # N이 짝수인 경우 M == N-M이므로 i와 j 값이 같아질 수 있음
            if i == j or j - i > M:
                continue

            # 중, 대 상자의 경계면 값이 같으면 같은 크기가 분리된 것이므로 무효
            elif C[j-1] == C[j]:
                continue

            # 조건을 모두 만족하는 경우 세 상자의 개수 차이 계산 및 최솟값 갱신
            else:
                boxes = [i, j-i, N-j]
                dif = max(boxes) - min(boxes)
                if min_dif > dif:
                    min_dif = dif

    # 탐색 후에도 min_dif가 갱신되지 않았다면 포장 불가(-1)
    if min_dif == N:
        min_dif = -1

    print(f'#{tc} {min_dif}')
