'''
미로 찾기 - 전형적인 DFS

1. 종료 조건 : 벽(1)을 만날 때

2. 델타 이동 시 범위 항상 체크하는 것 유의

3. (중요) DFS에서의 방문처리 복귀 (백트래킹)
'''
import sys
sys.stdin = open('input.txt', 'r')


# 0. 환경설정 

T = int(input())

d = [(-1, 0), (0, 1), (1, 0), (0, -1)] # 델타 탐색 4방향

def in_range(x, y):
    return 0 <= x < y

def dfs(r, c):
    
    # if visited[r][c]: # DFS (1) 가지치기 : 방문했던 곳
    #     return        # 그러나 이 문제에서는 경로가 겹치는 경우가 존재하지 않음
    
    if arr[r][c] == 3: # DFS (2) 종료 조건 : 도착 지점에 도달
        result.append(1)   # result 리스트를 채우기 (if result 시 False가 나지 않게)
        return
    
    visited[r][c] = True    # DFS (3) 방문처리
    
    for dr, dc in d:        # 다음에 갈 수 있는 경로들에 대해서
        nr = r + dr
        nc = c + dc
        
        if in_range(nr, N) and in_range(nc, N): # DFS (4) 다음 경로 탐색 조건 : (1) 범위 내에 있고
            if arr[nr][nc] != 1 and not visited[nr][nc]:                 # (2) 벽이 아닐 때
                
                dfs(nr, nc) 
                
                # 모든 경로를 탐색하는 문제에서 필요함
                # visited[nr][nc] = False

for tc in range(1, T+1):
    
    N = int(input())
    arr = [list(map(int, list(input()))) for _ in range(N)]
    visited = [[False]*N for _ in range(N)]
    
    result = []
    
    for i in range(N):
        for j in range(N):
            
            if arr[i][j] == 2: # 입구 찾으면 탐색 시작
                
                dfs(i, j)
                
                if result:
                    print(f"#{tc} 1")
                
                else : print(f"#{tc} 0")