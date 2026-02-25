# 그래프 탐색 실전 - 섬 찾기

#=======================================================

# BFS 풀이

import sys
from collections import deque


N, M = map(int, input().split())
islands = [list(map(int, input())) for _ in range(N)]

dr = [-1, 1, 0, 0, -1, -1, 1, 1]
dc = [0, 0, -1, 1, -1, 1, -1, 1]

# BFS를 통해 연결된 모든 땅(1)을 방문 처리하는 함수
def visit(r, c):
    q = deque()
    
    # 시작 지점 방문 표시 및 큐 삽입
    is_visited[r][c] = True
    q.append((r, c))

    while q:
        # 8개 방향에 대해 인접한 칸 탐색
        cur_r, cur_c = q.popleft()
        for d in range(8):
            nr = cur_r + dr[d]
            nc = cur_c + dc[d]
            
            # 1) 범위 내에 있고 2) 땅(1)이며 3) 아직 방문하지 않은 경우
            if (0 <= nr < N and 0 <= nc < M
                and islands[nr][nc] == 1
                and not is_visited[nr][nc]):
                # 방문 표시 후 다음 탐색을 위해 큐에 삽입
                is_visited[nr][nc] = True
                q.append((nr, nc))                                                                                                      

# 전체 방문 여부를 관리하는 2차원 리스트
is_visited = [[False] * M for _ in range(N)]
islands_cnt = 0  # 발견된 섬의 개수

# 격자의 모든 칸을 순회
for r in range(N):
    for c in range(M):
        # 새로운 땅(1)을 발견했고 아직 방문하지 않았다면 새로운 섬으로 판단
        if islands[r][c] == 1 and not is_visited[r][c]:
            islands_cnt += 1  # 섬의 개수 증가
            visit(r, c)       # 이 섬과 연결된 모든 땅을 BFS로 방문 처리

print(islands_cnt)
