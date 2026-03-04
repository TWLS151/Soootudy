'''
리팩토링 ver.

핵심 : "상태 변화에 매몰되지 말아라"
-> 매 선택마다 다음 상태, 값이 달라지는 유형의 문제라면?
--> '방문 처리 (배열) 기반의 활성 / 비활성화' 방식으로 풀자

1. 리스트 슬라이싱 대신 방문처리 기반 인덱스 탐색으로
-> for문의 i(인덱스)를 중심으로 값 활성 / 비활성 문제이다.
-> 이 구조는 제거, 조합 제거, 에너지 모으기 등의 문제에서도 동일하게 적용된다.

2. 더 강력한 가지치기 ? 
-> O(N) 내의 가벼운 계산으로, '느슨한 경계'를 찾는 방법
-> 현실적으로 나올 수 있는 범위보다 높지만, 가지치기에 있어 효과적

3. (추후 공부) branch ordering : 가능한 max_score를 빠르게 올리는 경우부터 계산하는 방법
++ branch ordering을 함께 적용해야 빠르게 가지치기가 가능하다

++ (이 문제에 적용한다면?) 인덱스(i) 별 gain 값을 계산하고, gain이 큰 경우부터 dfs를 탐색하도록 하는 방법
'''

import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

def dfs_shooting(shoot, score):

    global max_score


    if shoot == N:                          # 2. 종료 조건 : 모든 풍선을 쐈다면
        max_score = max(max_score, score)   # 최소값 검사 후 갱신
        return

    remaining_max = 0                       # <핵심> 느슨한 가지치기
    for i in range(N):
        if not visited[i]:
            remaining_max = max(remaining_max, arr[i])  # (1) 현재 최대값을 찾는다

    upper_bound = remaining_max * remaining_max  * (N - shoot) # (2) 남은 풍선 값에서 터무니없이 큰 값을 계산한다

    if score + upper_bound <= max_score:    # (3) 그 값을 더했는데도 현재 최대값보다 낮다면 볼 필요 없다.
        return


    for i in range(N):                      # 남은 풍선들에 대해
        if visited[i]:                      # 이미 쏜 풍선이면 pass
            continue



        l = i - 1                           # 3. L, R 검사
        while l >= 0 and visited[l]:        
            l -= 1

        r = i + 1
        while r < N and visited[r]:
            r += 1

        if l >= 0 and r < N:                # (1) L, R 모두 존재
            gain = arr[l] * arr[r]          # 양 옆 풍선의 곱

        elif l >= 0:                        # (2) L만 존재
            gain = arr[l]                   # 오른쪽 풍선
        
        elif r < N:                         # (3) R만 존재
            gain = arr[r]                   # 왼쪽 풍선
        
        else: gain = arr[i]                 # (4) 자기 자신만 남았을 때

        visited[i] = True                   # 지금 쏘는 풍선을 방문처리
        
        dfs_shooting(shoot + 1, score + gain)    # 4. 다음 탐색 - shoot + 1
        
        visited[i] = False                  # 5. 백트래킹 - 상태 복구

for tc in range(1, T+1):

    N = int(input())
    arr = list(map(int, input().split()))
    visited = [False]*N
    max_score = 0

    dfs_shooting(0, 0)

    print(f"#{tc} {max_score}")