T = int(input())

for tc in range(1, T + 1):
    N, M = map(int, input().split())
    area = [list(map(int, input().split())) for _ in range(N)]

    dr = [-1, 1, 0, 0]
    dc = [0, 0, -1, 1]

    max_power = 0

    for r in range(N):
        for c in range(M):
            power_cnt = area[r][c]
            for d in range(4):
                for i in range(1, area[r][c] + 1):
                    nr = r + dr[d] * i
                    nc = c + dc[d] * i
                    if 0 <= nr < N and 0 <= nc < M:
                        power_cnt += area[nr][nc]
                    else:
                        break
            if max_power < power_cnt:
                max_power = power_cnt

    print(f'#{tc} {max_power}')