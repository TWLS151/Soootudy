import sys
sys.stdin = open('input.txt','r')
from itertools import combinations

T = int(input())

# 1. 필요 로직 구축

# (1) 양봉이 가능한 모든 경우를 담은 리스트를 생성, 반환해주는 함수
def find_area():

    target_area = []

    for r in range(N):
        for c in range(N-M+1):
            target_area.append((arr[r][c:c+M], r, c))

    return target_area

# (2)

def collecting_honey(depth, total):

    global max_total

    if depth == 2:                              # 1. <종료> 두 일꾼 모두 수확을 마쳤을 때
        max_total = max(max_total, total)
        return

    for selected_area in candidates:                   # 2. 가능한 모든 후보들 중 하나를 선택

        honey_list, r, c = selected_area               # (1) 현재 정보를 언패킹

        if True in visited[r][c:c+M]:                              # 가지치기 1 - 이전 일꾼과 겹치는 곳은 pass
            continue


        for i in range(0, M):                           # 3. 방문처리
            visited[r][c + i] = True

        gain = 0                                        # 4. 수확량 계산

        if sum(honey_list) <= C:                        # (1) 선택 영역의 벌꿀 전체 합이 C보다 낮으면
            for honey in honey_list:                    # 모든 벌통 수확 가능
                gain += honey**2                        # 현재 수확량에 추가


        else:                                           ## (2) Hint! 합이 C를 넘지 않는 모든 조합에 대해 수확량 계산법
            possible_collection = []
            for j in range(1, len(honey_list)+1):       # 1개부터 모든 개수까지의 조합 중
                for comb in combinations(honey_list, j):

                    if sum(comb) <= C:                   # 합이 C보다 낮다면
                        temp = 0

                        for honey in comb:              # 해당 조합의
                            temp += honey**2
                        else: possible_collection.append(temp)

            gain = max(possible_collection)

        collecting_honey(depth + 1, total + gain)

        for k in range(0, M):                           # 5. 백트래킹
            visited[r][c + k] = False


for tc in range(1, T+1):

    N, M, C = map(int, input().split()) # 배열 크기 N, 벌통 개수 M, 최대 칸 수 C
    arr = [list(map(int, input().split())) for _ in range(N)]
    visited = [[False]*N for _ in range(N)]
    max_total = 0
    collected_honey = []

    candidates = find_area()

    collecting_honey(0, 0)

    print(f"#{tc} {max_total}")