# SWEA 1249 - 보급로 문제
# BFS인데, 다익스트라가 더 효율적이라고 해서 heapq 배운 후 다시 풀어보겠습니다.
# 아래는 BFS로 arr의 모든 경로에 대해 최소비용을 갱신하는 풀이입니다.

from collections import deque

T = int(input())
d = [(-1, 0), (1, 0), (0, -1), (0, 1)]

def in_range(x, y):
    return 0 <= x < y

def bfs(r, c): 
    
    q = deque() # queue
    
    q.append((r, c, arr[r][c])) # 핵심 : (r, c, cost)를 저장
    
    distance[r][c] = arr[r][c]  # 시작점의 비용을 더하고 시작
    
    while q:
        vr, vc, cost = q.popleft()      # 1. 좌표값, 도달 비용을 불러옴
                
        for dr, dc in d:                # 2. 상하좌우 4방향에 대해
            nr, nc = vr + dr, vc + dc   # 다음 좌표를 저장하고
            
            if in_range(nr, N) and in_range(nc, N): # 범위 내에 있고
                next_cost = cost + arr[nr][nc] # 다음 지역으로의 비용을 계산 
                
                if distance[nr][nc] > next_cost:  # 더 작은 비용으로 도달할 수 있다면
                    distance[nr][nc] = next_cost  # 해당 비용을 기록
                    q.append((nr, nc, next_cost)) # 해당 좌표를 탐색 (안가본 곳 자동 방문, 가본 곳 갱신)

    return distance[N-1][N-1]

for tc in range(1, T + 1):
    
    N = int(input())
    arr = [list(map(int, list(input()))) for _ in range(N)]
    distance = [[float('inf')]*N for _ in range(N)] # 최단 (최소 비용) 거리의 핵심 : 거리 배열 (w/ Dijkstra)
    result = bfs(0,0)
    
    print(f"#{tc} {result}")