# SWEA-1209 Sum


T = 10

for test_case in range(1, T + 1):
    N = int(input())
    matrix = [list(map(int, input().split())) for _ in range(100)]

    max_sum = 0
    sum_d1 = 0
    sum_d2 = 0

    for r in range(100):
        # 행(—)의 합 계산 및 갱신
        sum_r = sum(matrix[r])
        if max_sum < sum_r:
            max_sum = sum_r

        # 열(|)의 합 계산 및 갱신
        sum_c = 0
        for c in range(100):
            sum_c += matrix[c][r]
        if max_sum < sum_c:
            max_sum = sum_c

        # 대각선(X)의 합 계산
        sum_d1 += matrix[r][r]
        sum_d2 += matrix[r][99 - r]

    print(f'#{test_case} {max(max_sum, sum_d1, sum_d2)}')
