# SWEA-9490 풍선팡

"""
# 최적화 방안
1. balloons[r][c]를 반복적으로 참조하기보다 변수에 담아 재사용
2. 범위를 벗어나면 break를 활용해 해당 방향 탐색 중단
"""

#=========================================


T = int(input())

for test_case in range(1, T + 1):
    N, M = map(int, input().split())
    balloons = [list(map(int, input().split())) for _ in range(N)]

    dr = [-1, 1, 0, 0]
    dc = [0, 0, -1, 1]

    max_pollen = 0

    for r in range(N):
        for c in range(M):
            pollen_cnt = dist = balloons[r][c]
            
            for d in range(4):
                for i in range(1, balloons[r][c] + 1):
                    nr = r + dr[d] * i
                    nc = c + dc[d] * i
                    if 0 <= nr < N and 0 <= nc < M:
                        pollen_cnt += balloons[nr][nc]
                    else:
                        break  # 범위를 벗어나면 해당 방향 탐색 중단

            if max_pollen < pollen_cnt:
                max_pollen = pollen_cnt

   print(f'#{test_case} {max_pollen}')
