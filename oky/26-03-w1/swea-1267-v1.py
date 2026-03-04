# SWEA-1267 작업순서
# DFS 추가문제

"""
저번 A형 시험 1번 문제였던 선수과목과 아주 유사한 문제여서 저번과 같은 방식으로 풀었다.
조만간 정석 방식으로 다시 풀어봐야겠다.
"""
# ==================================================


T = 10

def check_sub(work, sub, order):
    # work를 선행 작업으로 가지는 후속 작업 k 확인
    for k in sub[work]:
        # 후속 작업의 순서가 선행 작업 순서보다 작거나 같다면 갱신 필요
        if order[k] <= order[work]:
            order[k] = order[work] + 1
            # 갱신된 순서를 바탕으로 다시 후속 작업들 탐색 (재귀)
            check_sub(k, sub, order)
        else:
            continue

for test_case in range(1, T + 1):
    V, E = map(int, input().split())
    edges = iter(map(int, input().split()))

    # 각 작업 번호를 인덱스로 하여 '그 작업 이전에 수행되어야 하는 작업들(선행 작업)'을 담는 리스트
    prev_data = [0] + [[] for _ in range(V)]
    # 각 작업 번호를 인덱스로 하여 '그 작업 이후에 수행해야 하는 작업들(후속 작업)'을 담는 리스트
    subseq_data = [0] + [[] for _ in range(V)]
    # 각 작업의 순서를 1로 초기화
    order = [0] + [1] * V

    for prev_work in edges:
        subseq_work = next(edges)
        prev_data[subseq_work].append(prev_work)
        subseq_data[prev_work].append(subseq_work)

    # 선행 작업 리스트 순회
    for i in range(1, V + 1):
        # 선행 작업이 존재하는 경우
        if prev_data[i]:
            # 1) 현재 작업의 순서 결정: 선행 작업 중 가장 늦게 끝나는 작업 순서 + 1
            order[i] = max(order[x] for x in prev_data[i]) + 1
            # 2) 현재 작업의 순서가 변했으므로, 이 작업을 먼저 수행해야하는 후속 작업들의 순서 갱신 (재귀함수 호출)
            check_sub(i, subseq_data, order)

    print(order)
    result = []

    for j in range(1, max(order) + 1):
        while j in order:
            work_num = order.index(j)
            result.append(work_num)
            order[work_num] = 0

    print(f'#{test_case}', *result)
