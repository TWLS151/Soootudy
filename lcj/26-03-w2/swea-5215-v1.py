T = int(input())

def score_dict(lst):  # 재료 번호 (입력 순서 순) 별 점수 딕셔너리
    dict1 = dict()

    for i in range(1, len(lst)+1):
        dict1.setdefault(i, lst[i - 1][0])

    return dict1

def cost_dict(lst):    # 재료 번호 (입력 순서 순) 별 칼로리 딕셔너리
    dict2 = dict()

    for i in range(1, len(lst)+1):
        dict2.setdefault(i, lst[i - 1][1])

    return dict2

def make_burger(idx, curr_lst, total):  # 칼로리 제한 안으로 고를 수 있는 모든 재료 집합을 구하는 함수

    if total > limit:                           # 가지치기 : 칼로리 제한을 넘은 경우
        return
                                                # 종료조건 - 더이상 담을 수 있는 칼로리가 없을 때
    elif total + min_cost[1] > limit:
        result.append(curr_lst)                 # 결과 리스트에 재료 조합을 저장
        return

    if idx == N:                                # 종료조건 2 - 재료를 끝까지 탐색했을 때
        return

    make_burger(idx + 1, curr_lst + [material_num[idx]], total + cost_lst[material_num[idx]]) # idx번째 재료를 선택했을 때

    make_burger(idx + 1, curr_lst, total) # 선택하지 않았을 때


def calculate_best(lst): # 재료 조합의 총 점수를 계산해 반환하는 함수

    total_score = 0

    for ingredient in lst:
        total_score += score_lst[ingredient]

    return total_score


for tc in range(1, T+1):

    N, limit = map(int, input().split())
    material = [list(map(int, input().split())) for _ in range(N)]

    min_cost = min(material, key=lambda x:x[1]) # <메모이제이션> 추가할 수 있는 칼로리 중 최소 (가지치기 활용)

    score_lst = score_dict(material)
    cost_lst = cost_dict(material)

    material_num = [i for i in range(1, N+1)]   # 재료 번호 리스트

    result = []                                 # 재료 조합을 담을 빈 리스트
    make_burger(0, [], 0)                       # 탐색 : (종료 이후) 가능한 모든 재료 조합 리스트가 반환

    max_score = 0

    for ingred_case in result:                  # 재료 조합 리스트를 돌면서

        score = calculate_best(ingred_case)     # 점수 계산 함수를 통해 조합 별 점수 계산

        if max_score < score:                   # 최대 점수보다 클 시 갱신
            max_score = score

    print(f"#{tc} {max_score}")