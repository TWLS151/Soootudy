# 델타
dr = [-1, 1, 0, 0]
dc = [0, 0, -1, 1]

# 경비원 시야는 X로 표시
def update_visibility(n, board, start_r, start_c):
    for i in range(4):
        dist = 1
        while True:
            nr = start_r + dr[i] * dist
            nc = start_c + dc[i] * dist
            # 벗어나거나 기둥을 만나면 정지
            if not (0 <= nr < n and 0 <= nc < n) or board[nr][nc] == 1:
                break
            # 0이면  X 표시
            if board[nr][nc] == 0:
                board[nr][nc] = 'X'
            dist += 1

T = int(input())

for tc in range(1, T + 1):
    N = int(input())
    # 맵 받기이
    grid = [list(map(int, input().split())) for _ in range(N)]

    # 1. 경비병 위치 구하기
    guard_r, guard_c = -1, -1
    for r in range(N):
        for c in range(N):
            if grid[r][c] == 2:
                guard_r, guard_c = r, c
                break
        if guard_r != -1: break

    # 2. 시야 업데
    if guard_r != -1:
        update_visibility(N, grid, guard_r, guard_c)
    # 3. 안전한곳 개수
    safe_count = 0
    for row in grid:
        safe_count += row.count(0)

    print(f"#{tc} {safe_count}")