# SWEA - 1953
# 탈주범 검거

from collections import deque
# import sys
# sys.stdin = open('input.txt')

dirs = [
    (-1, 0), (1, 0), (0, -1), (0, 1)
]

pipes = {
    1: [0, 1, 2, 3],
    2: [0, 1],
    3: [2, 3],
    4: [0, 3],
    5: [1, 3],
    6: [1, 2],
    7: [0, 2]
}

oppo = {
    0: 1,
    1: 0,
    2: 3,
    3: 2
}

def CanIGoThere(nr, nc, field, dist, idx):

    if not (0 <= nr < N and 0 <= nc < M):  # 범위 먼저
        return False
    if not (field[nr][nc] != 0):  # 벽 안됨
        return False
    if dist[nr][nc] != -1:  # 처음 가는 곳만
        return False
    if oppo[idx] not in pipes[field[nr][nc]]:  # 진행 방향에 길이 뚫려있는지 확인
        return False
    
    return True


def bfs(R, C, field):
    global N, M, L

    q = deque([(R, C)])
    dist = [[-1] * M for _ in range(N)]
    dist[R][C] = 1

    while q:
        row, col = q.popleft()

        if dist[row][col] == L:
            continue

        for idx in range(4):
            if idx in pipes[field[row][col]]:
                dr, dc = dirs[idx]
                nr, nc = row+dr, col+dc

                if CanIGoThere(nr, nc, field, dist, idx):
                    q.append((nr, nc))
                    dist[nr][nc] = dist[row][col] + 1

    count = 0
    for row in dist:
        for val in row:
            if 0 <= val <= L:
                count += 1
    
    return count

    pass


TC = int(input())
for test_case in range(1, TC+1):
    N, M, R, C, L = map(int, input().split())
    field = [list(map(int, input().split())) for _ in range(N)]

    print(f'#{test_case} {bfs(R, C, field)}')