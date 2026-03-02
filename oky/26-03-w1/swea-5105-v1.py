# SWEA-5105 미로의 거리
# BFS 풀이

"""
큐에 좌표와 함께 이동 거리를 저장(r, c, cnt)하여
별도의 메모리 기록 없이 각 지점까지의 최단 거리를 관리함
"""

# ==================================================


from collections import deque

T = int(input())

dr = [-1, 1, 0, 0]
dc = [0, 0, -1, 1]

def bfs(N, maze):
    # 1. 시작점(2) 탐색
    sr, sc = -1, -1
    for r in range(N):
        for c in range(N):
            if maze[r][c] == 2:
                sr, sc = r, c
                break
        if sr != -1: break

    # 2. 탐색 자원 초기화
    q = deque([(sr, sc, 0)])
    visited = [[False] * N for _ in range(N)]
    visited[sr][sc] = True  # 시작점 방문 처리

    # 3. BFS 탐색
    while q:
        # 큐에서 현재 좌표(r, c)와 이동 거리(cnt)를 꺼냄
        r, c, cnt = q.popleft()

        for d in range(4):
            nr = r + dr[d]
            nc = c + dc[d]
            # 경계선 검사
            if 0 <= nr < N and 0 <= nc < N:
                # 목적지(3)를 찾으면 현재까지의 이동 거리(cnt) 반환
                if maze[nr][nc] == 3:
                    return cnt
                # 길(0)이고 아직 방문하지 않았다면 탐색 대상으로 추가
                if maze[nr][nc] == 0 and not visited[nr][nc]:
                    q.append((nr, nc, cnt + 1))
                    visited[nr][nc] = True  # 큐에 넣는 시점에 방문 처리

    return 0  # 큐가 빌 때까지 목적지를 못 찾으면 0 반환

for test_case in range(1, T + 1):
    N = int(input())
    maze = [list(map(int, input())) for _ in range(N)]

    print(f'#{test_case} {bfs(N, maze)}')
