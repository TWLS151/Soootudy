'''
# 문제 조건
1. tc로 제시되는 두 정점의 가장 가까운 공통 조상 노드를 탐색
2. 공통 조상 노드를 정점으로 하는 서브트리의 크기를 반환

# 문제 접근

1. 공통 조상은 어떻게 찾을 수 있을까? 
- parent 리스트를 만들어서 역 경로 추적 (제공된 노드 ~ 루트 노드)
- path1, path2 -> set으로 만들어서 -1번 인덱스 추출

2. 트리의 개수  -> 굳이 트리? 그래프로 접근해보자
- 트리에 대해 DFS -> cnt += 1

3. 재귀에서 원하는 값을 추출해내는 방법에 대해 익히는 것이 중요
- 서브트리의 개수를 구할 때, global보다 더 재귀적으로 적절한 방법은?
- return 으로 자식의 계산값 -> 부모에게 전달

'''
import sys
sys.stdin = open('input.txt', 'r')

# 0. 환경설정

T = int(input())

# 1. 필요 로직 구축 

# (1) 서브 트리 크기 세기 (DFS)

def dfs_recursive(start_node):

    total = 1   # 자기 자신을 개수 포함

    for next_node in adj_lst[start_node]: 

        if next_node == parent[start_node]: # 부모 노드는 방문 X
            continue
        
        total += dfs_recursive(next_node) # <핵심> 전달된 자식 노드의 계산 결과를 반영

    return total  # <핵심> 부모 노드에 개수를 전달


for tc in range(1, T+1):

    V, E, v1, v2 = map(int, input().split()) # 정점 수 V, 간선 수 E, 목표 노드
    arr = list(map(int, input().split()))
    adj_lst = [[] for _ in range(V+1)] # 인접 리스트
    parent = [[] for _ in range(V+1)] # 자식 노드에 대한 부모 노드 리스트

    # 1. 인접 리스트 및 자식 노드 리스트 생성

    for i in range(E):
        n1, n2 = arr[i*2], arr[i*2+1] # 트리 정보 입력

        adj_lst[n1].append(n2)
        adj_lst[n2].append(n1)

        parent[n2] = n1

    # print(adj_lst)
    # print(parent)
    # 2. 루트 노드까지의 경로 찾기
    node1, path1 = v1, []
    node2, path2 = v2, []

    while node2 or node1: # 루트 노드 (빈 리스트)를 찾을 때 까지 경로 추가

        if node1:
            path1.append(node1)
            node1 = parent[node1]
        
        if node2:
            path2.append(node2)
            node2 = parent[node2]

    # 3. 가장 가까운 조상 노드 찾기

    ancestor_node = False
    for i in range(len(path1)):
        for j in range(len(path2)):

            if path1[i] == path2[j]: # 공통 조상 노드를 발견 했다면 (첫 번째로 찾는 값 == 가장 빠른 조상)
                ancestor_node = path1[i]
                break
        if ancestor_node:
            break

    # print(ancestor_node)
    
    # 현황 : 가장 가까운 공통 조상 노드 발견
    # 4. 해당 노드 기준 서브트리의 크기 세기 

    visited = [False] * (V + 1)
    
    result = dfs_recursive(ancestor_node)

    print(f"#{tc} {ancestor_node} {result}")