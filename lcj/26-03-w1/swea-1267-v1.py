'''
위상 정렬 문제라고 합니다.
개념 학습 전에, 유향 그래프 특성만 고려해도 풀 수 있을 것 같아서
BFS로 풀어봤습니다. 

우선 SWEA에서 정답처리는 됐는데... 나중에 위상정렬 학습 후 다시 풀어보겠습니다.

<참고>

preorder - 해당하는 노드를 처리하기 전에 먼저 처리되어야 하는 노드(유향 그래프의 시작점 노드)
postorder - 해당 노드 처리 이후에 접근할 수 있는 노드 (유향 그래프의 도착점 노드)

p.s. D6 풀었으니 커리어 하이 달성
'''

import sys
sys.stdin = open('input.txt','r')
from collections import deque

def bfs_work_order(post_list, pre_list, visit_list):

    # print(f"후에 할 작업 : {post_list}")
    # print(f"먼저 해야할 작업 : {pre_list}")

    q = deque()
    work_order = []

    for node in range(1, V+1):

        if not pre_list[node]: # 1. 만약 선처리 해야하는 노드가 없다면 push 후 방문처리
            q.append(node)
            visited[node] = True
            work_order.append(node)

    # print(visit_list)
    # print(q)

    while q:

        current_node = q.popleft()                # 1. 현재 작업할 노드를 출력

        for next_node in post_list[current_node]: # 현재 노드에 이어서 할 작업들에 대해

            if next_node in q:                    # 이미 처리 예정이라면(큐에 들어있다면) -> skip
                continue

            must_list = pre_list[next_node]       # 2. 선행 처리 조건을 만족하는지 탐색

            for must_node in must_list:           # 각 선행 노드에 대해
                if not visit_list[must_node]:     # 처리되지 않았다면 -> 해당 노드는 작업 순서에 들어올 수 없음
                    break
            else:                                 # 3.  
                q.append(next_node)               # 선행 작업이 모두 처리되었다면 push
                visit_list[next_node] = True      # 방문 처리(push 기준)  
                work_order.append(next_node)      # 작업 순서 리스트에 추가

    return work_order


for tc in range(1, 11):
    V, E = map(int, input().split())
    arr = list(map(int, input().split()))   # 유향 그래프 연결 정보
    postorder = [[] for _ in range(V+1)]    # 선행 작업 리스트
    preorder = [[] for _ in range(V+1)]     # 후행 작업 리스트
    visited = [False] * (V+1)               # 방문 리스트

    for i in range(E):                      # 1. 노드 연결 정보 입력
        n1, n2 = arr[i*2], arr[i*2+1]

        postorder[n1].append(n2)            # (n1 -> n2) : 후행 리스트
        preorder[n2].append(n1)             # (n2 -> n1) : 선행 리스트


    result = bfs_work_order(postorder, preorder, visited)
    print(f"#{tc}", *result, sep=" ")
