import sys

# 1. 노드들의 좌표 탐색
def find_node():
    max_v = 0

    for i in range(N):
        for j in range(N):
            if board[i][j] != 0:
                locs[board[i][j]] = (i, j)
                max_v = max(max_v, abs(board[i][j]))
    
    # 방문해야 할 번호들 리스트 만들기
    for i in range(1, max_v + 1):
        contents.append(i)   
        contents.append(-i)  
    return max_v

def dfs(r, c, distance, count):
    global min_distance

    # 가지치기: 현재 거리가 이미 최솟값보다 크면 중단
    if distance >= min_distance:
        return

    # 종료조건: 모든 장소(몬스터 + 고객 = max_val * 2)를 방문했을 때
    if count == max_val * 2:
        min_distance = min(distance, min_distance)
        return

    # 탐색
    for node in contents:
        # 아직 방문하지 않은 곳이라면
        if not visited_contents[node]:
            
            # 1. 몬스터(양수)인 경우
            if node > 0:
                nr, nc = locs[node]
                dist = abs(r - nr) + abs(c - nc)
                
                visited_contents[node] = True
                dfs(nr, nc, distance + dist, count + 1)
                visited_contents[node] = False 
                
            # 2. 고객(음수)인 경우
            else:
                monster_num = abs(node)
                if visited_contents[monster_num]: 
                    nr, nc = locs[node]
                    dist = abs(r - nr) + abs(c - nc)
                    
                    visited_contents[node] = True
                    dfs(nr, nc, distance + dist, count + 1)
                    visited_contents[node] = False 
                    

T = int(input())
for tc in range(1, T + 1):
    N = int(input())
    board = [list(map(int, input().split())) for _ in range(N)]
    
    contents = []
    locs = {} 
    min_distance = float('inf')

    max_val = find_node()
    
    # 방문 체크용 딕셔너리
    visited_contents = {node: False for node in contents}
    
    # (0, 0)에서 시작, 초기 이동거리 0, 방문 횟수 0
    dfs(0, 0, 0, 0)

    print(f'#{tc} {min_distance}')