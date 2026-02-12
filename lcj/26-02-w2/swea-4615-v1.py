# 미완입니다
T = int(input())

d = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1,0), (1,-1), (0,-1), (-1,-1)]

def orthello(arr, move):

    for c_m, r_m, color in move: # 1. 돌 놓기

        r = r_m-1 # 행 이동 위치
        c = c_m-1 # 열 이동 위치
        arr[r][c] = color # 해당 위치에 돌 놓기
        change_list = []

        for dr, dc in d: # 2. 사잇돌 바꾸기 (돌 탐색 w/ 델타)
            is_change = False

            for p in range(1, N):
                nr = r + dr*p   # 행 이동 위치
                nc = c + dc*p   # 열 이동 위치

                if 0 <= nr < N and 0 <= nc < N:  # 옳은 범위 내에서
                    if arr[nr][nc] != color: # 다른 색을 만나면 -> 계속 탐색
                        is_change = True

                        change_list.append((nr, nc))
                        continue

                    if arr[nr][nc] == color and is_change: # 같은 색을 만나면

                        for cr, cc in change_list:
                            arr[cr][cc] = color

    else: # 게임 종료 이후

        b_cnt = 0
        for r in range(N):
            for c in range(N):
                if arr[r][c] == 1:
                    b_cnt += 1

        return b_cnt

for tc in range(1, T+1):

    N, M = map(int, input().split())

    move = [tuple(map(int, input().split())) for _ in range(M)]

    arr = [[0]*N for _ in range(N)]

    arr[N//2][N//2] = arr[N//2-1][N//2-1] = 2
    arr[N//2][N//2-1] = arr[N//2-1][N//2] = 1

    result = orthello(arr, move)

    print(f"#{tc} {result} {N**2 - result}")