T = int(input())

for tc in range(1, T + 1):
    N = int(input())  # 공간의 넓이 : N x N
    # 2차원 공간 정보 입력 (0: 빈 공간, 1: 기둥, 2: 경비병)
    space = [list(map(int, input().split())) for _ in range(N)]

    blind_spot = 0

    # 전체 공간을 순회하며 초기 빈 공간(0)의 개수 파악 및 경비병 위치 저장
    for r in range(N):
        for c in range(N):
            if space[r][c] == 2:
                guard_r, guard_c = r, c
            elif space[r][c] == 0:
                blind_spot += 1

    # 방향 벡터 : 상 하 좌 우
    dr = [-1, 1, 0, 0]
    dc = [0, 0, -1, 1]

    # 4개 방향에 대해 경비병의 시야 탐색
    for i in range(4):
        for j in range(1, N):  # 최대 N만큼 직선 이동
            nr = guard_r + dr[i] * j
            nc = guard_c + dc[i] * j

            # 경계 내에 있고, 빈 공간(0)이라면 사각지대에서 제외
            if 0 <= nr < N and 0 <= nc < N and space[nr][nc] == 0:
                blind_spot -= 1
            # 기둥(1)을 만나거나 경계를 벗어나면 탐색 종료
            else:
                break

    print(f'#{tc} {blind_spot}')