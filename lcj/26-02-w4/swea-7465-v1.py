import sys
sys.stdin = open('input.txt', 'r')
'''
# 문제 접근

1. 인접 리스트를 순회하면서 방문처리

2. DFS 1턴 탐색

3. 이후, 1~N번 방문 리스트 사이 False가 남아있다면
-> 그룹 수를 증가

4. (주의) 이웃 정보가 없는 무리가 있음에 주의
'''

T = int(input())

def dfs(start_person):
    
    # 1. 만약 방문했던 이웃이라면 skip
    if visited[start_person]:
        return
    
    # 2. 방문처리 이후 인접 리스트 불러오기
    visited[start_person] = True
    
    for next_person in neighbor[start_person]:
        
        dfs(next_person)

for tc in range(1, T+1):
    
    V, E = map(int, input().split()) # 사람 수 V, 간선 수 E
    
    neighbor = [[] for _ in range(V+1)] # 인접 리스트
    visited = [False] * (V + 1) # 방문 리스트
    group = 0
    
    for _ in range(E): # 1. 인접 리스트 만들기
        
        couple = tuple(map(int, input().split())) # 이웃 사람들의 정보
        
        if len(couple) == 1: # 주의! 이웃 정보가 없는 인풋인 경우도 존재
            continue
        
        n1, n2 = couple
        neighbor[n1].append(n2)
        neighbor[n2].append(n1) # 인접 리스트에 정보 입력
    
    print(neighbor)
    
    for person in range(1, V+1): # 2. 무리 찾기
    
        if not visited[person]: # 만약 새로운 무리를 발견하면
            group += 1
            dfs(person)         # 무리의 구성원 찾기

    print(f"#{tc} {group}")